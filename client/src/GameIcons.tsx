import { ReactNode } from 'react';
type P = { size?: number; className?: string };

const wrap = (color: string, body: ReactNode) => ({ size = 24, className }: P) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" className={className} aria-hidden="true">
    {body}
  </svg>
);

// Оригинальные эмблемы, не логотипы игр
export const Dota2Icon = wrap('#fb7185', <><path d="M16 3l11 6.5v13L16 29 5 22.5v-13z" fill="#fb718533" /><path d="M16 10l5 6-5 6-5-6z" fill="#fb7185" /></>);
export const BrawlIcon = wrap('#fbbf24', <path d="M16 3l3.8 7.7 8.5 1.2-6.1 6 1.4 8.4L16 22.3l-7.6 4 1.4-8.4-6.1-6 8.5-1.2z" fill="#fbbf2433" />);
export const Cs2Icon = wrap('#38bdf8', <><circle cx="16" cy="16" r="9" fill="#38bdf822" /><path d="M16 3v7M16 22v7M3 16h7M22 16h7" /><circle cx="16" cy="16" r="1.5" fill="#38bdf8" /></>);
export const MinecraftIcon = wrap('#a3e635', <><path d="M16 3l11 6v14l-11 6-11-6V9z" fill="#a3e63522" /><path d="M5 9l11 6 11-6M16 15v14" /></>);
export const DdnetIcon = wrap('#34d399', <><circle cx="16" cy="15" r="10" fill="#34d39922" /><circle cx="12.5" cy="13" r="2" fill="#34d399" /><circle cx="19.5" cy="13" r="2" fill="#34d399" /><ellipse cx="11" cy="27" rx="4" ry="2" fill="#34d39944" /><ellipse cx="21" cy="27" rx="4" ry="2" fill="#34d39944" /></>);
