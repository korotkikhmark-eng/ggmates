import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { GAMES } from '../games';

interface Row { id: string; game: string; status: 'ACTIVE' | 'FINISHED'; createdAt: string }

export default function Teams() {
  const [rows, setRows] = useState<Row[] | null>(null); const [err, setErr] = useState('');
  useEffect(() => { api<Row[]>('/teams').then(setRows).catch(e => setErr(e.message)); }, []);
  if (err) return <p className="text-rose-400" role="alert">{err}</p>;
  if (!rows) return <p className="text-slate-400">Загрузка…</p>;
  const block = (title: string, list: Row[], active: boolean) => (
    <section className="space-y-2"><h2 className="font-bold text-lg">{title}</h2>
      {list.length === 0 ? <p className="text-slate-500 text-sm">Пока пусто.</p> : list.map(r => {
        const inner = (<><span className="font-semibold">{GAMES.find(g => g.id === r.game)?.name}</span><span className="text-xs text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</span></>);
        return active ? <Link key={r.id} to={'/team/' + r.id} className="glass p-4 flex justify-between hover:border-violet/60">{inner}</Link>
          : <div key={r.id} className="glass p-4 flex justify-between opacity-60">{inner}</div>; })}</section>);
  return (<div className="max-w-xl space-y-6"><h1 className="text-3xl font-extrabold">Мои команды</h1>
    {block('Активные', rows.filter(r => r.status === 'ACTIVE'), true)}{block('Завершённые', rows.filter(r => r.status === 'FINISHED'), false)}</div>);
}
