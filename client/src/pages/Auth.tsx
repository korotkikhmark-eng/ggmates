import { FormEvent, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Logo } from '../Logo';
import { api } from '../api';
import { useAuth, User } from '../auth';

export default function AuthPage() {
  const { setUser } = useAuth();
  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [f, setF] = useState({ nickname: '', discord: '', password: '', confirm: '' });
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  async function submit(e: FormEvent) {
    e.preventDefault(); setErr('');
    if (mode === 'register' && f.password !== f.confirm) return setErr('Пароли не совпадают');
    setBusy(true);
    try {
      const body = mode === 'register' ? { nickname: f.nickname, discord: f.discord, password: f.password } : { nickname: f.nickname, password: f.password };
      setUser(await api<User>('/auth/' + mode, { method: 'POST', body }));
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  }
  return (
    <main className="min-h-screen grid place-items-center p-4">
      <form onSubmit={submit} className="glass w-full max-w-md sm:max-w-lg lg:max-w-xl p-6 sm:p-10 space-y-5">
        <Logo size={44} text="text-3xl sm:text-4xl" />
        <p className="text-slate-400 text-sm sm:text-base">{mode === 'register' ? 'Создай аккаунт и найди тиммейтов.' : 'С возвращением!'}</p>
        <label className="block text-sm sm:text-base">Никнейм<input className="input mt-1" value={f.nickname} onChange={set('nickname')} required minLength={3} maxLength={24} autoComplete="username" /></label>
        {mode === 'register' && <label className="block text-sm sm:text-base">Discord<input className="input mt-1" value={f.discord} onChange={set('discord')} required placeholder="username" /></label>}
        <label className="block text-sm sm:text-base">Пароль<input type="password" className="input mt-1" value={f.password} onChange={set('password')} required minLength={8} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} /></label>
        {mode === 'register' && <label className="block text-sm sm:text-base">Повторите пароль<input type="password" className="input mt-1" value={f.confirm} onChange={set('confirm')} required autoComplete="new-password" /></label>}
        {err && <p role="alert" className="text-rose-400 text-sm">{err}</p>}
        <button className="btn w-full text-base sm:text-lg py-3" disabled={busy}>{busy && <Loader2 className="animate-spin" size={18} />}{mode === 'register' ? 'Зарегистрироваться' : 'Войти'}</button>
        <button type="button" className="text-sm text-slate-400 hover:text-white w-full" onClick={() => { setMode(mode === 'register' ? 'login' : 'register'); setErr(''); }}>
          {mode === 'register' ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Регистрация'}
        </button>
      </form>
    </main>
  );
}
