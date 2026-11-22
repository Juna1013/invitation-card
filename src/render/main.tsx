import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { Card, type EventInfo, type Person } from '../card/Card';
import { deriveTheme, resolveColor } from '../domain/theme';

export type RenderArgs = { event: EventInfo; person: Person; color: string };

declare global {
  interface Window {
    /** Playwright から呼ぶ：カードを描画し、フォント読込と描画の完了を待つ */
    renderCard: (args: RenderArgs) => Promise<{ minContrast: number }>;
  }
}

const root = createRoot(document.getElementById('root')!);

window.renderCard = async ({ event, person, color }) => {
  const { tokens, minContrast } = deriveTheme(resolveColor(color));
  flushSync(() => root.render(<Card event={event} person={person} tokens={tokens} />));
  await document.fonts.ready;
  await Promise.all([...document.images].map((img) => img.decode().catch(() => {}))); // 和傘 SVG の読込完了を待つ
  await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
  return { minContrast };
};
