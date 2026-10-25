export type Game = 'DOTA2' | 'BRAWL_STARS' | 'CS2' | 'DDNET';
export type Level = 'any' | 'beginner' | 'mid' | 'high';
export interface SearchParams {
  game: Game; teamSize: number; mode?: string; level: Level;
  language: string; goal: 'ranked' | 'casual' | 'learning' | 'chat';
}
export interface Entry { userId: string; params: SearchParams; createdAt: number }
export type EnqueueResult =
  | { status: 'queued'; found: number }
  | { status: 'matched'; group: Entry[] }
  | { status: 'busy' }
  | { status: 'invalid' };

const compatible = (a: SearchParams, b: SearchParams) =>
  a.game === b.game && a.teamSize === b.teamSize && a.language === b.language &&
  a.goal === b.goal && (!a.mode || !b.mode || a.mode === b.mode) &&
  (a.level === 'any' || b.level === 'any' || a.level === b.level);

/** Серверная очередь подбора. Один пользователь — один активный поиск. */
export class Matchmaker {
  private queue = new Map<string, Entry>();
  constructor(private ttlMs = 5 * 60_000, private now = () => Date.now()) {}

  has(userId: string) { return this.queue.has(userId); }

  /** Сколько совместимых игроков (включая самого пользователя) ждут сейчас. */
  progress(userId: string) {
    const me = this.queue.get(userId);
    if (!me) return 0;
    return [...this.queue.values()].filter(e => compatible(me.params, e.params)).length;
  }

  enqueue(userId: string, params: SearchParams): EnqueueResult {
    if (!Number.isInteger(params.teamSize) || params.teamSize < 2 || params.teamSize > 5) return { status: 'invalid' };
    if (this.queue.has(userId)) return { status: 'busy' };
    const me: Entry = { userId, params, createdAt: this.now() };
    const group: Entry[] = [me];
    for (const e of [...this.queue.values()].sort((a, b) => a.createdAt - b.createdAt)) {
      if (group.length >= params.teamSize) break;
      if (group.every(g => compatible(g.params, e.params))) group.push(e);
    }
    if (group.length === params.teamSize) {
      group.forEach(g => this.queue.delete(g.userId));
      return { status: 'matched', group };
    }
    this.queue.set(userId, me);
    return { status: 'queued', found: this.progress(userId) };
  }

  cancel(userId: string) { return this.queue.delete(userId); }

  /** Удаляет просроченные запросы, возвращает id пользователей. */
  expire(): string[] {
    const t = this.now() - this.ttlMs;
    const gone = [...this.queue.values()].filter(e => e.createdAt <= t).map(e => e.userId);
    gone.forEach(id => this.queue.delete(id));
    return gone;
  }
}
