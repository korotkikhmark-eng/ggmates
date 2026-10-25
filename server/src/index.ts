import 'express-async-errors';
import 'dotenv/config';
import http from 'node:http';
import express, { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { Server } from 'socket.io';
import { prisma } from './db.js';
import { authRouter, requireAuth } from './auth.js';
import { Matchmaker } from './matchmaker.js';
import { setupSockets } from './sockets.js';

if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 16) throw new Error('Задайте SESSION_SECRET (>=16 символов) в .env');
const origin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin, credentials: true } });
const mm = new Matchmaker();

app.use(helmet());
app.use(cors({ origin, credentials: true }));
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());
app.use('/api', rateLimit({ windowMs: 60_000, limit: 120 }));
app.use('/api/auth', rateLimit({ windowMs: 15 * 60_000, limit: 30 }));
app.use((req, res, next) => { // CSRF: SameSite=Strict + проверка Origin на изменяющих запросах
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && req.headers.origin && req.headers.origin !== origin)
    return res.status(403).json({ error: 'Forbidden' });
  next();
});
app.use('/api/auth', authRouter);

app.get('/api/teams', requireAuth, async (_req, res) => {
  const rows = await prisma.teamMember.findMany({ where: { userId: res.locals.uid }, include: { team: true }, orderBy: { joinedAt: 'desc' } });
  res.json(rows.map((m) => ({ id: m.team.id, game: m.team.game, status: m.leftAt ? 'FINISHED' : m.team.status, params: m.team.params, createdAt: m.team.createdAt })));
});
app.get('/api/teams/:id', requireAuth, async (req, res) => {
  const mem = await prisma.teamMember.findFirst({ where: { teamId: req.params.id, userId: res.locals.uid, leftAt: null } });
  if (!mem) return res.status(404).json({ error: 'Команда не найдена' });
  const team = await prisma.team.findUnique({ where: { id: req.params.id }, include: { members: { where: { leftAt: null }, include: { user: { select: { id: true, nickname: true, discord: true } } } } } });
  const online = new Set((await io.fetchSockets()).map((s) => s.data.uid));
  res.json({ id: team!.id, game: team!.game, params: team!.params, members: team!.members.map((m) => ({ ...m.user, online: online.has(m.user.id) })) });
});
app.patch('/api/profile', requireAuth, async (req, res) => {
  const { z } = await import('zod');
  const p = z.object({
    bio: z.string().max(300),
    games: z.array(z.enum(['DOTA2', 'BRAWL_STARS', 'CS2', 'DDNET', 'MINECRAFT'])).max(4),
    discord: z.string().trim().min(2, 'Discord слишком короткий').max(40).regex(/^[\w.#-]+$/, 'Недопустимый Discord').optional(),
  }).safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: p.error.issues[0].message });
  try {
    const u = await prisma.user.update({ where: { id: res.locals.uid }, data: p.data });
    res.json({ bio: u.bio, games: u.games, discord: u.discord });
  } catch (e: any) {
    if (e.code === 'P2002') return res.status(409).json({ error: 'Этот Discord уже занят' });
    throw e;
  }
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => { console.error(err); res.status(500).json({ error: 'Внутренняя ошибка' }); });
setupSockets(io, mm);
setInterval(() => mm.expire().forEach((id) => io.to('user:' + id).emit('queue:cancelled', { reason: 'timeout' })), 10_000);
server.listen(Number(process.env.PORT) || 4000, () => console.log('GG MATES server up'));
