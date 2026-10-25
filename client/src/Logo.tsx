export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <defs><linearGradient id="ggm-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#8b5cf6" /><stop offset="1" stopColor="#3b82f6" /></linearGradient></defs>
      <rect width="32" height="32" rx="9" fill="url(#ggm-g)" />
      <circle cx="12" cy="16" r="6.5" fill="none" stroke="#fff" strokeWidth="2.2" />
      <circle cx="20" cy="16" r="6.5" fill="none" stroke="#fff" strokeOpacity=".75" strokeWidth="2.2" />
    </svg>
  );
}

export function Logo({ size = 32, text = 'text-2xl' }: { size?: number; text?: string }) {
  return (
    <span className="inline-flex items-center gap-3 font-extrabold" aria-label="GG MATES">
      <LogoMark size={size} />
      <span className={text}>GG <span className="text-violet">MATES</span></span>
    </span>
  );
}
