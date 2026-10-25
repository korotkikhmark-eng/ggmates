import { describe, it, expect } from 'vitest';
import { Matchmaker, SearchParams } from './matchmaker';
const p = (o: Partial<SearchParams> = {}): SearchParams =>
  ({ game: 'CS2', teamSize: 2, level: 'any', language: 'ru', goal: 'casual', ...o });

describe('Matchmaker', () => {
  it('собирает команду из совместимых игроков', () => {
    const m = new Matchmaker();
    expect(m.enqueue('a', p()).status).toBe('queued');
    expect(m.enqueue('b', p()).status).toBe('matched');
    expect(m.has('a')).toBe(false);
  });
  it('не смешивает игры, языки и конкретные уровни', () => {
    const m = new Matchmaker();
    m.enqueue('a', p({ level: 'high' }));
    expect(m.enqueue('b', p({ game: 'DDNET' })).status).toBe('queued');
    expect(m.enqueue('c', p({ language: 'en' })).status).toBe('queued');
    expect(m.enqueue('d', p({ level: 'beginner' })).status).toBe('queued');
  });
  it('запрещает повторный поиск и невалидный размер', () => {
    const m = new Matchmaker();
    m.enqueue('a', p());
    expect(m.enqueue('a', p()).status).toBe('busy');
    expect(m.enqueue('x', p({ teamSize: 1 })).status).toBe('invalid');
  });
  it('отмена освобождает место', () => {
    const m = new Matchmaker();
    m.enqueue('a', p());
    expect(m.cancel('a')).toBe(true);
    expect(m.enqueue('b', p()).status).toBe('queued');
  });
  it('истекшие запросы удаляются', () => {
    let t = 0; const m = new Matchmaker(1000, () => t);
    m.enqueue('a', p()); t = 1500;
    expect(m.expire()).toEqual(['a']);
    expect(m.has('a')).toBe(false);
  });
});
