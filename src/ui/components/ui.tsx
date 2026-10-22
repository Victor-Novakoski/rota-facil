import type { ReactNode } from 'react';

const PATHS = {
  file: 'M6 2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm7 1.5V9h5.5L13 3.5ZM8 13v2h8v-2H8Zm0 4v2h5v-2H8Z',
  download: 'M11 3h2v10.2l3.6-3.6 1.4 1.4-6 6-6-6 1.4-1.4 3.6 3.6V3ZM4 19h16v2H4v-2Z',
  check: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm-1.2 14.2-4-4 1.4-1.4 2.6 2.6 5.6-5.6 1.4 1.4-7 7Z',
  alert: 'M1 21h22L12 2 1 21Zm12-3h-2v-2h2v2Zm0-4h-2v-4h2v4Z',
  lock: 'M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5Zm-3 8V7a3 3 0 1 1 6 0v3H9Z',
  back: 'M20 11H7.8l5.6-5.6L12 4l-8 8 8 8 1.4-1.4L7.8 13H20v-2Z',
  help: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 17h-2v-2h2v2Zm2.1-7.7-.9.9c-.7.7-1.2 1.3-1.2 2.8h-2v-.5c0-1.1.5-2.1 1.2-2.8l1.2-1.3A2 2 0 0 0 12 7a2 2 0 0 0-2 2H8a4 4 0 0 1 8 0c0 .9-.4 1.7-.9 2.3Z',
  info: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 15h-2v-6h2v6Zm0-8h-2V7h2v2Z',
  pdf: 'M6 2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm7 1.5V9h5.5L13 3.5ZM7 13v6h1.5v-2h1a2 2 0 0 0 0-4H7Zm1.5 1.5h1a.5.5 0 0 1 0 1h-1v-1Z',
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 24 }: { name: IconName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className="icon">
      <path fill="currentColor" d={PATHS[name]} />
    </svg>
  );
}

export function Logo({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" className="logo">
      <rect width="48" height="48" rx="12" className="logo-bg" />
      <path d="M12 36 C 12 24, 36 28, 36 14" fill="none" className="logo-road" strokeWidth="3.5" strokeLinecap="round" strokeDasharray="1 7" />
      <circle cx="12" cy="36" r="4.5" className="logo-start" />
      <circle cx="36" cy="14" r="4.5" className="logo-end" />
    </svg>
  );
}

/** Texto com trechos **em negrito**. */
export function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
        part.startsWith('**') ? <b key={i}>{part.slice(2, -2)}</b> : <span key={i}>{part}</span>,
      )}
    </>
  );
}

export function Banner({ tone, title, children }: { tone: 'ok' | 'bad'; title: string; children?: ReactNode }) {
  return (
    <div className={`banner ${tone}`} role={tone === 'bad' ? 'alert' : 'status'}>
      <Icon name={tone === 'ok' ? 'check' : 'alert'} size={28} />
      <div>
        <strong>{title}</strong>
        {children}
      </div>
    </div>
  );
}
