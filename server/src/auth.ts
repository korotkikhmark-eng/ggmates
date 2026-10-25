import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from './db.js';

const SECRET = () => process.env.SESSION_SECRET as string;
export const COOKIE = 'ggm_session';
const cookieOpts = { httpOnly: true, sameSite: 'strict' as const, secure: process.env.NODE_ENV === 'production', maxAge: 7 * 864e5 };
export const verify = (t?: string) => { try { return (jwt.verify(t || '', SECRET()) as { uid: string }).uid; } catch { return null; } };

const reg = z.object({
  nickname: z.string().trim().min(3).max(24).regex(/^[\w.-]+$/, 'Только буквы, цифры, . _ -'),
  discord: z.string().trim().min(2).max(40).regex(/^[\w.#-]+$/, 'Недопустимый Discord'),
  password: z.string().min(8).max(100),
});
const login = z.object({ nickname: z.string().trim().max(24), password: z.string().max(100) });
const pub = (u: { id: string; nickname: string; discord: string; bio: string; games: string[] }) =>
  ({ id: u.id, nickname: u.nickname, discord: u.discord, bio: u.bio, games: u.games });

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const uid = verify(req.cookies?.[COOKIE]);
  if (!uid) return res.status(401).json({ error: 'Требуется вход' });
  res.locals.uid = uid; next();
}

export const authRouter = Router();
const start = (res: Response, uid: string) =>
  res.cookie(COOKIE, jwt.sign({ uid }, SECRET(), { expiresIn: '7d' }), cookieOpts);

authRouter.post('/register', async (req, res) => {
  const p = reg.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: p.error.issues[0].message });
  try {
    const { nickname, discord, password } = p.data;
    const u = await prisma.user.create({ data: { nickname, discord, passwordHash: await bcrypt.hash(password, 12) } });
    start(res, u.id); res.status(201).json(pub(u));
  } catch (e: any) {
    if (e.code === 'P2002') return res.status(409).json({ error: 'Ник или Discord уже заняты' });
    throw e;
  }
});
authRouter.post('/login', async (req, res) => {
  const p = login.safeParse(req.body);
  const u = p.success ? await prisma.user.findUnique({ where: { nickname: p.data.nickname } }) : null;
  if (!p.success || !u || !(await bcrypt.compare(p.data.password, u.passwordHash)))
    return res.status(401).json({ error: 'Неверный ник или пароль' });
  start(res, u.id); res.json(pub(u));
});
authRouter.post('/logout', (_req, res) => { res.clearCookie(COOKIE); res.status(204).end(); });
authRouter.get('/me', requireAuth, async (_req, res) => {
  const u = await prisma.user.findUnique({ where: { id: res.locals.uid } });
  if (!u) return res.status(401).json({ error: 'Требуется вход' });
  res.json(pub(u));
});
