export type IconName = 'clock' | 'pin' | 'chat';

/** アクションタイル用の単純なアイコン（currentColor で着色） */
export function Icon({ name }: { name: IconName }) {
  const common = { width: 16, height: 16, viewBox: '0 0 24 24', 'aria-hidden': true } as const;
  switch (name) {
    case 'clock':
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3.5 2" />
        </svg>
      );
    case 'pin':
      return (
        <svg {...common} fill="currentColor">
          <path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" />
        </svg>
      );
    case 'chat':
      return (
        <svg {...common} fill="currentColor">
          <path d="M4 4h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H9.5L5 21v-4H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" />
        </svg>
      );
  }
}
