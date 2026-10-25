import { useEffect } from 'react';
import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { Home as HomeIcon, User as UserIcon, Users, LogOut, Loader2 } from 'lucide-react';
import { useAuth } from './auth';
import AuthPage from './pages/Auth';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Search from './pages/Search';
import Team from './pages/Team';
import Teams from './pages/Teams';
import { socket } from './socket';

const nav = [{ to: '/', label: 'Главная', icon: HomeIcon }, { to: '/teams', label: 'Мои команды', icon: Users }, { to: '/profile', label: 'Профиль', icon: UserIcon }];

export default function App() {
  const { user, loading, logout } = useAuth();
  useEffect(() => { if (user) socket.connect(); else socket.disconnect(); }, [user?.id]);
  if (loading) return <div className="min-h-screen grid place-items-center"><Loader2 className="animate-spin text-violet" size={32} aria-label="Загрузка" /></div>;
  if (!user) return <AuthPage />;
  const link = ({ isActive }: { isActive: boolean }) => `flex items-center gap-3 px-4 py-3 lg:py-3.5 rounded-xl text-base lg:text-lg ${isActive ? 'bg-violet/20 text-white' : 'text-slate-400 hover:text-white'}`;
  return (
    <div className="md:flex min-h-screen">
      <aside className="hidden md:flex w-64 lg:w-80 shrink-0 flex-col gap-2 p-5 lg:p-6 border-r border-line">
        <div className="text-2xl lg:text-3xl font-extrabold px-4 py-4">GG <span className="text-violet">MATES</span></div>
        {nav.map(n => <NavLink key={n.to} to={n.to} end className={link}><n.icon size={22} />{n.label}</NavLink>)}
        <button onClick={logout} className="mt-auto flex items-center gap-3 px-4 py-3 text-base lg:text-lg text-slate-400 hover:text-white"><LogOut size={22} />Выйти</button>
      </aside>
      <main className="flex-1 p-5 md:p-10 pb-24 md:pb-10">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/search/:game" element={<Search />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/team/:id" element={<Team />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      <nav className="md:hidden fixed bottom-0 inset-x-0 glass rounded-b-none flex justify-around p-2" aria-label="Навигация">
        {nav.map(n => <NavLink key={n.to} to={n.to} end className={link}><n.icon size={20} /><span className="sr-only">{n.label}</span></NavLink>)}
        <button onClick={logout} className="p-2.5 text-slate-400" aria-label="Выйти"><LogOut size={20} /></button>
      </nav>
    </div>
  );
}
