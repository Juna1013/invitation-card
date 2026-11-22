import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { Card, type EventInfo, type Person } from '../card/Card';
import { deriveTheme } from '../domain/theme';

export type RenderArgs = { event: EventInfo; person: Person; color: string };

declare global {
  interface Window {
    /** Playwright から呼ぶ：カードを描画し、フォント読込と描画の完了を待つ */
    renderCard: (args: RenderArgs) => Promise<{ minContrast: number }>;
  }
}

const root = createRoot(document.getElementById('root')!);

window.renderCard = async ({ event, person, color }) => {
  const { tokens, minContrast } = deriveTheme(color);
  flushSync(() => root.render(<Card event={event} person={person} tokens={tokens} />));
  await document.fonts.ready;
  // 和傘の SVG（CSS の mask で使う）の読込完了を待つ
  const urls = [...document.querySelectorAll<HTMLElement>('.card__wagasa')]
    .map((el) => el.style.maskImage.match(/url\("?(.+?)"?\)/)?.[1])
    .filter((u): u is string => !!u);
  await Promise.all(
    urls.map(
      (u) =>
        new Promise<void>((r) => {
          const img = new Image();
          img.onload = img.onerror = () => r();
          img.src = u;
        }),
    ),
  );
  await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
  return { minContrast };
};
