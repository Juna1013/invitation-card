import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { Card, type EventInfo, type Person } from '../card/Card';
import { qrText } from '../domain/qr';
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
  flushSync(() =>
    root.render(<Card event={event} person={person} tokens={tokens} qrText={qrText(event.rsvpUrl, person.no)} />),
  );
  await document.fonts.ready;
  await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
  return { minContrast };
};
