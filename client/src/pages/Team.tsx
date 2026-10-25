import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Copy, LogOut, Send, Wifi, WifiOff } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../auth';
import { socket } from '../socket';
import { GAMES, GOALS } from '../games';

interface Member { id: string; nickname: string; discord: string; online: boolean }
interface TeamData { id: string; game: string; params: { goal?: string; server?: string }; members: Member[] }
interface Msg { id: string; text: string; nickname: string; userId: string; createdAt: string }

let leaveTimer: ReturnType<typeof setTimeout> | undefined;

export default function Team() {
  const { id = '' } = useParams(); const nav = useNavigate(); const { user } = useAuth();
  const [team, setTeam] = useState<TeamData | null>(null); const [err, setErr] = useState('');
  const [msgs, setMsgs] = useState<Msg[]>([]); const [text, setText] = useState('');
  const [online, setOnline] = useState(socket.connected); const [copied, setCopied] = useState('');
  const left = useRef(false);
  const [sendErr, setSendErr] = useState(''); const end = useRef<HTMLDivElement>(null);

  const load = useCallback(() => api<TeamData>('/teams/' + id).then(setTeam).catch(e => setErr(e.message)), [id]);
  useEffect(() => {
    load();
    const hist = () => socket.emit('chat:history', { teamId: id }, (r: { messages?: Msg[] }) => r?.messages && setMsgs(r.messages));
    const onMsg = (m: Msg & { teamId: string }) => { if (m.teamId === id) setMsgs(a => a.some(x => x.id === m.id) ? a : [...a, m]); };
    const onPres = (d: { teamId: string; userId: string; online: boolean }) => { if (d.teamId === id) setTeam(t => t && { ...t, members: t.members.map(m => m.id === d.userId ? { ...m, online: d.online } : m) }); };
    const onConn = () => { setOnline(true); hist(); load(); }; const onDis = () => setOnline(false);
    socket.on('chat:message', onMsg); socket.on('team:presence', onPres); socket.on('team:update', load); socket.on('connect', onConn); socket.on('disconnect', onDis);
    if (socket.connected) hist();
    return () => { socket.off('chat:message', onMsg); socket.off('team:presence', onPres); socket.off('team:update', load); socket.off('connect', onConn); socket.off('disconnect', onDis); };
  }, [id, load]);
  // Уход со страницы лобби = выход из лобби (отложенный вызов переживает двойной монтаж StrictMode)
  useEffect(() => {
    clearTimeout(leaveTimer);
    return () => { leaveTimer = setTimeout(() => { if (!left.current) socket.emit('team:leave', { teamId: id }); }, 200); };
  }, [id]);
  useEffect(() => end.current?.scrollIntoView({ behavior: 'smooth' }), [msgs]);

  const send = (e: FormEvent) => {
    e.preventDefault(); if (!text.trim()) return; setSendErr('');
    socket.emit('chat:send', { teamId: id, text }, (r: { error?: string }) => r?.error ? setSendErr(r.error) : setText(''));
  };
  const leave = () => { left.current = true; socket.emit('team:leave', { teamId: id }, () => nav('/teams')); };
  const copy = (d: string) => { navigator.clipboard.writeText(d); setCopied(d); setTimeout(() => setCopied(''), 1500); };

  if (err) return <p className="text-rose-400" role="alert">{err}</p>;
  if (!team) return <p className="text-slate-400">Загрузка…</p>;
  const g = GAMES.find(x => x.id === team.game);
  return (
    <div className="grid lg:grid-cols-[320px_1fr] gap-5">
      <section className="glass p-5 space-y-4 h-fit">
        <h1 className="text-xl font-extrabold">{g?.name}</h1>
        <p className="text-xs text-slate-400">{team.params.server ? team.params.server + ' · ' : ''}{team.params.goal ? GOALS[team.params.goal] + ' · ' : ''}игроков {team.members.length}/5{team.members.length < 5 ? ' · ждём остальных' : ''}</p>
        {team.members.length === 1 && (
          <div className="flex items-center gap-4 rounded-xl border border-violet/40 bg-violet/10 p-4" role="status">
            <span className="relative flex h-10 w-10 shrink-0">
              <span className="absolute inline-flex h-full w-full rounded-full bg-violet opacity-50 animate-ping" />
              <span className="relative inline-flex h-10 w-10 rounded-full border-4 border-violet/30 border-t-violet animate-spin" />
            </span>
            <div><div className="font-semibold">Ищем игроков…</div><div className="text-xs text-slate-400">Пока вы один в лобби (1/5)</div></div>
          </div>)}
        <ul className="space-y-2">{team.members.map(m => (
          <li key={m.id} className="flex items-center justify-between gap-2 rounded-xl border border-line p-3">
            <div className="min-w-0"><div className="font-semibold truncate"><span className={`inline-block w-2 h-2 rounded-full mr-2 ${m.online ? 'bg-emerald-400' : 'bg-slate-600'}`} />{m.nickname}</div>
              <div className="text-xs text-slate-400 truncate">{m.discord}</div></div>
            <button className="p-2 text-slate-300 hover:text-white" onClick={() => copy(m.discord)} aria-label={`Копировать Discord ${m.nickname}`}>{copied === m.discord ? '✓' : <Copy size={16} />}</button>
          </li>))}</ul>
        <button className="btn w-full" onClick={leave}><LogOut size={18} /> Покинуть лобби</button>
        <p className="text-xs text-slate-500">Если вы перейдёте на другую страницу, вы автоматически покинете лобби.</p>
      </section>
      <section className="glass flex flex-col h-[70vh]">
        <div className="px-5 py-3 border-b border-line flex items-center justify-between text-sm">Чат лобби
          <span className={`flex items-center gap-1 ${online ? 'text-emerald-400' : 'text-amber-400'}`}>{online ? <Wifi size={16} /> : <WifiOff size={16} />}{online ? 'Подключено' : 'Переподключение…'}</span></div>
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {msgs.length === 0 && <p className="text-slate-500 text-center mt-10">Сообщений пока нет. Поздоровайтесь первыми!</p>}
          {msgs.map(m => (<div key={m.id} className={m.userId === user?.id ? 'text-right' : ''}>
            <div className="text-xs text-slate-500">{m.nickname} · {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            <div className={`inline-block max-w-[80%] px-3 py-2 rounded-2xl text-left break-words ${m.userId === user?.id ? 'bg-violet/30' : 'bg-white/5'}`}>{m.text}</div></div>))}
          <div ref={end} />
        </div>
        <form onSubmit={send} className="p-3 border-t border-line flex gap-2">
          <input className="input" value={text} onChange={e => setText(e.target.value)} maxLength={500} placeholder="Сообщение…" aria-label="Сообщение" />
          <button className="btn" disabled={!online || !text.trim()} aria-label="Отправить"><Send size={18} /></button>
        </form>
        {sendErr && <p role="alert" className="px-4 pb-2 text-xs text-rose-400">{sendErr}</p>}
      </section>
    </div>
  );
}
