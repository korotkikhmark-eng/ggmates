export async function api<T = unknown>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  const r = await fetch('/api' + path, {
    method: opts.method || 'GET', credentials: 'include',
    headers: opts.body ? { 'Content-Type': 'application/json' } : undefined,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  if (r.status === 204) return undefined as T;
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || 'Ошибка запроса');
  return d as T;
}
