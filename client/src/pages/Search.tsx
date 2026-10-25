import { FormEvent, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2, Search as SearchIcon } from 'lucide-react';
import { socket } from '../socket';
import { GAMES, GOALS, SERVERS } from '../games';

export default function Search() {
  const { game = '' } = useParams(); const nav = useNavigate();
  const info = GAMES.find(g => g.id === game);
  const [goal, setGoal] = useState('casual'); const [server, setServer] = useState(SERVERS[0]); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  if (!info) return <p>Игра не найдена.</p>;
  const submit = (e: FormEvent) => {
    e.preventDefault(); setErr(''); setBusy(true);
    socket.emit('queue:join', { game, goal: game === 'MINECRAFT' ? undefined : goal, server: game === 'MINECRAFT' ? server : undefined }, (r: { teamId?: string; error?: string }) => {
      setBusy(false); if (r?.error) setErr(r.error); else nav('/team/' + r.teamId);
    });
  };
  return (
    <form onSubmit={submit} className="glass p-6 sm:p-8 max-w-xl space-y-5">
      <h1 className="text-2xl font-extrabold flex items-center gap-3"><info.icon size={34} /> {info.name}: поиск лобби</h1>
      <p className="text-sm text-slate-400">Вы попадёте в открытое лобби до 5 игроков или создадите новое.</p>
      {game !== 'MINECRAFT' && <label className="block text-sm sm:text-base">Цель
        <select className="input mt-1" value={goal} onChange={e => setGoal(e.target.value)}>{Object.entries(GOALS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>}
      {game === 'MINECRAFT' && (
        <label className="block text-sm sm:text-base">Сервер
          <select className="input mt-1" value={server} onChange={e => setServer(e.target.value)}>{SERVERS.map(s => <option key={s}>{s}</option>)}</select></label>)}
      {err && <p role="alert" className="text-rose-400 text-sm">{err}</p>}
      <button className="btn w-full sm:w-fit" disabled={busy}>{busy ? <Loader2 className="animate-spin" size={18} /> : <SearchIcon size={18} />} Найти лобби</button>
    </form>
  );
}
