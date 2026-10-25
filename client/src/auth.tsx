import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from './api';

export interface User { id: string; nickname: string; discord: string; bio: string; games: string[] }
interface Ctx { user: User | null; loading: boolean; setUser: (u: User | null) => void; logout: () => Promise<void> }
const AuthCtx = createContext<Ctx>(null!);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api<User>('/auth/me').then(setUser).catch(() => setUser(null)).finally(() => setLoading(false)); }, []);
  const logout = async () => { await api('/auth/logout', { method: 'POST' }).catch(() => {}); setUser(null); };
  return <AuthCtx.Provider value={{ user, loading, setUser, logout }}>{children}</AuthCtx.Provider>;
}
