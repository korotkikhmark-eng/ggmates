import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useAuth } from '../auth';
import { GAMES } from '../games';

export default function Home() {
  const { user } = useAuth();
  return (
    <div className="space-y-8 max-w-5xl">
      <header>
        <h1 className="text-3xl font-extrabold">Привет, <span className="text-violet">{user?.nickname}</span> 👋</h1>
        <p className="text-slate-400 mt-1">Выбери игру и найди команду прямо сейчас.</p>
      </header>
      <section className="grid gap-4 sm:gap-6 md:grid-cols-2">
        {GAMES.map(g => (
          <article key={g.id} className={`glass p-6 sm:p-8 min-h-48 sm:min-h-60 bg-gradient-to-br ${g.grad} flex flex-col gap-4 hover:border-violet/60 transition-colors`}>
            <div className="flex items-center gap-4"><span className="grid place-items-center w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-black/30"><g.icon size={38} /></span><h2 className="text-xl sm:text-2xl font-bold">{g.name}</h2></div>
            <p className="text-slate-300 text-sm sm:text-base flex-1">{g.desc}</p>
            <Link to={`/search/${g.id}`} className="btn w-full sm:w-fit"><Search size={18} /> Найти лобби</Link>
          </article>
        ))}
      </section>
    </div>
  );
}
