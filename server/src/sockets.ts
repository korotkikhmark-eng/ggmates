import { Server } from 'socket.io';
import { parse } from 'cookie';
import { z } from 'zod';
import { prisma } from './db.js';
import { COOKIE, verify } from './auth.js';
import { Matchmaker } from './matchmaker.js';

export const SERVERS = ['FunTime', 'ReallyWorld', 'FunnyMC', 'Cristalix', 'MineLegacy', 'SpookyTime'] as const;
const params = z.object({
  game: z.enum(['DOTA2', 'BRAWL_STARS', 'CS2', 'DDNET', 'MINECRAFT']),
  teamSize: z.number().int().min(2).max(5),
  mode: z.string().max(30).optional(),
  level: z.enum(['any', 'beginner', 'mid', 'high']),
  language: z.string().min(2).max(10),
  goal: z.enum(['ranked', 'casual', 'learning', 'chat']),
});
const isMember = (teamId: string, userId: string) =>
  prisma.teamMember.findFirst({ where: { teamId, userId, leftAt: null, team: { status: 'ACTIVE' } } });

export function setupSockets(io: Server, mm: Matchmaker) {
  io.use((s, next) => {
    const uid = verify(parse(s.handshake.headers.cookie || '')[COOKIE]);
    if (!uid) return next(new Error('unauthorized'));
    s.data.uid = uid; next();
  });

  io.on('connection', async (s) => {
    const uid = s.data.uid as string;
    s.join('user:' + uid);
    const mine = await prisma.teamMember.findMany({ where: { userId: uid, leftAt: null, team: { status: 'ACTIVE' } } });
    mine.forEach((m) => { s.join('team:' + m.teamId); io.to('team:' + m.teamId).emit('team:presence', { teamId: m.teamId, userId: uid, online: true }); });
    if (mm.has(uid)) s.emit('queue:status', { found: mm.progress(uid) });

    // Лобби: игрок попадает в открытое лобби (до 5 человек) своей игры и цели или создаёт новое
    s.on('queue:join', async (raw, ack = () => {}) => {
      const p = z.object({ game: params.shape.game, goal: params.shape.goal.optional(), server: z.enum(SERVERS).optional() }).safeParse(raw);
      if (!p.success) return ack({ error: 'Неверные параметры поиска' });
      if (p.data.game === 'MINECRAFT' && !p.data.server) return ack({ error: 'Выберите сервер' });
      if (p.data.game !== 'MINECRAFT') delete p.data.server;
      if (p.data.game === 'MINECRAFT') delete p.data.goal;
      else if (!p.data.goal) return ack({ error: 'Выберите цель' });
      if (await prisma.teamMember.findFirst({ where: { userId: uid, leftAt: null, team: { status: 'ACTIVE' } } }))
        return ack({ error: 'Вы уже состоите в активном лобби (раздел «Мои команды»)' });
      try {
        const teamId = await prisma.$transaction(async (tx) => {
          const open = await tx.team.findMany({
            where: { status: 'ACTIVE', game: p.data.game, AND: [...(p.data.goal ? [{ params: { path: ['goal'], equals: p.data.goal } }] : []), ...(p.data.server ? [{ params: { path: ['server'], equals: p.data.server } }] : [])] },
            orderBy: { createdAt: 'asc' }, take: 20,
            include: { members: { where: { leftAt: null }, select: { userId: true } } },
          });
          const lobby = open.find((t) => t.members.length < 5);
          if (lobby) {
            await tx.teamMember.upsert({
              where: { teamId_userId: { teamId: lobby.id, userId: uid } },
              update: { leftAt: null, joinedAt: new Date() }, create: { teamId: lobby.id, userId: uid },
            });
            return lobby.id;
          }
          const t = await tx.team.create({ data: { game: p.data.game, teamSize: 5, params: p.data, members: { create: { userId: uid } } } });
          return t.id;
        }, { isolationLevel: 'Serializable' });
        await io.in('user:' + uid).socketsJoin('team:' + teamId);
        io.to('team:' + teamId).emit('team:update', { teamId });
        ack({ ok: true, teamId });
      } catch { ack({ error: 'Не удалось войти в лобби, попробуйте ещё раз' }); }
    });

    s.on('queue:cancel', (_a, ack = () => {}) => { mm.cancel(uid); s.emit('queue:cancelled', { reason: 'user' }); ack({ ok: true }); });

    s.on('chat:history', async (raw, ack = () => {}) => {
      const p = z.object({ teamId: z.string(), before: z.string().optional() }).safeParse(raw);
      if (!p.success || !(await isMember(p.data.teamId, uid))) return ack({ error: 'Нет доступа' });
      const rows = await prisma.chatMessage.findMany({
        where: { teamId: p.data.teamId, ...(p.data.before ? { createdAt: { lt: new Date(p.data.before) } } : {}) },
        orderBy: { createdAt: 'desc' }, take: 50, include: { user: { select: { nickname: true } } },
      });
      ack({ messages: rows.reverse().map((m) => ({ id: m.id, text: m.text, nickname: m.user.nickname, userId: m.userId, createdAt: m.createdAt })) });
    });

    s.on('chat:send', async (raw, ack = () => {}) => {
      const p = z.object({ teamId: z.string(), text: z.string().trim().min(1).max(500) }).safeParse(raw);
      if (!p.success) return ack({ error: 'Сообщение 1–500 символов' });
      const now = Date.now();
      if (now - (s.data.last || 0) < 700) return ack({ error: 'Слишком часто' });
      s.data.last = now;
      if (!(await isMember(p.data.teamId, uid))) return ack({ error: 'Нет доступа' });
      const m = await prisma.chatMessage.create({ data: { teamId: p.data.teamId, userId: uid, text: p.data.text }, include: { user: { select: { nickname: true } } } });
      io.to('team:' + p.data.teamId).emit('chat:message', { teamId: m.teamId, id: m.id, text: m.text, nickname: m.user.nickname, userId: uid, createdAt: m.createdAt });
      ack({ ok: true });
    });

    s.on('team:leave', async (raw, ack = () => {}) => {
      const teamId = z.string().safeParse(raw?.teamId);
      if (!teamId.success || !(await isMember(teamId.data, uid))) return ack({ error: 'Нет доступа' });
      await prisma.teamMember.update({ where: { teamId_userId: { teamId: teamId.data, userId: uid } }, data: { leftAt: new Date() } });
      if (!(await prisma.teamMember.count({ where: { teamId: teamId.data, leftAt: null } })))
        await prisma.team.update({ where: { id: teamId.data }, data: { status: 'FINISHED' } });
      await io.in('user:' + uid).socketsLeave('team:' + teamId.data);
      io.to('team:' + teamId.data).emit('team:update', { teamId: teamId.data });
      ack({ ok: true });
    });

    s.on('disconnect', () => {
      mine.forEach((m) => io.to('team:' + m.teamId).emit('team:presence', { teamId: m.teamId, userId: uid, online: false }));
      setTimeout(async () => { if ((await io.in('user:' + uid).fetchSockets()).length === 0) mm.cancel(uid); }, 15_000);
    });
  });
}
