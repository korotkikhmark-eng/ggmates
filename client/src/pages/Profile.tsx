import { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../auth';
import { GAMES } from '../games';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [discord, setDiscord] = useState(user?.discord ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [games, setGames] = useState<string[]>(user?.games ?? []);
  const [busy, setBusy] = useState(false); const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const toggle = (id: string) => setGames(g => g.includes(id) ? g.filter(x => x !== id) : [...g, id]);
  async function save() {
    setBusy(true); setMsg(null);
    try { const r = await api<{ bio: string; games: string[]; discord: string }>('/profile', { method: 'PATCH', body: { bio, games, discord } }); setUser({ ...user!, ...r }); setMsg({ ok: true, t: 'Профиль сохранён' }); }
    catch (e) { setMsg({ ok: false, t: (e as Error).message }); } finally { setBusy(false); }
  }
  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-3xl sm:text-4xl font-extrabold">Профиль</h1>
      <div className="glass p-6 sm:p-10 space-y-6">
        <div className="grid sm:grid-cols-2 gap-4 text-sm sm:text-base">
          <div><div className="text-slate-400">Ник</div><div className="font-semibold">{user?.nickname}</div></div>
          <label>Discord<input className="input mt-1" value={discord} onChange={e => setDiscord(e.target.value)} minLength={2} maxLength={40} required /></label>
        </div>
        <label className="block text-sm sm:text-base">О себе<textarea className="input mt-1" rows={5} maxLength={300} value={bio} onChange={e => setBio(e.target.value)} /></label>
        <fieldset><legend className="text-sm mb-2">Мои игры</legend>
          <div className="flex flex-wrap gap-2">{GAMES.map(g => (
            <button key={g.id} type="button" aria-pressed={games.includes(g.id)} onClick={() => toggle(g.id)}
              className={`px-4 py-2 rounded-full border text-sm sm:text-base ${games.includes(g.id) ? 'bg-violet/30 border-violet' : 'border-line text-slate-300'}`}>{g.name}</button>))}</div>
        </fieldset>
        <button className="btn" onClick={save} disabled={busy}>{busy ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />} Сохранить</button>
        {msg && <p role="status" className={msg.ok ? 'text-emerald-400 text-sm' : 'text-rose-400 text-sm'}>{msg.t}</p>}
        <p className="text-xs text-slate-500">Смена ника пока недоступна. Discord не проверяется: его видят только участники ваших команд.</p>
      </div>
    </div>
  );
}
