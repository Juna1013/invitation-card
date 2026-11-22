/**
 * クラス別カードの一覧画像（3×3）を生成する。委員会などへの共有用。
 * 実行: npm run sample && npm run overview  →  samples/overview.png に出力
 *
 * samples/cards/ の PNG（npm run sample で生成）を、card.yaml のクラス順に並べる。
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { loadConfig } from '../src/domain/config';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const cardsDir = resolve(root, 'samples/cards');
const outFile = resolve(root, 'samples/overview.png');

const { event, classColors } = await loadConfig(resolve(root, 'card.yaml'));
const files = await readdir(cardsDir);

const tiles: string[] = [];
for (const [className, color] of Object.entries(classColors)) {
  const file = files.find((f) => f.endsWith('.png') && f.split('_')[1] === className);
  if (!file) throw new Error(`${className} のサンプルがありません。先に npm run sample を実行してください`);
  const data = (await readFile(resolve(cardsDir, file))).toString('base64');
  tiles.push(`<figure><img src="data:image/png;base64,${data}" alt="${className}"><figcaption><b>${className}</b>　${color}</figcaption></figure>`);
}

const html = `<!doctype html><html lang="ja"><meta charset="utf-8"><style>
  body { margin: 0; padding: 48px; width: 1264px; background: #efece4; color: #2b2b2b;
         font-family: "Noto Sans JP", "Noto Sans CJK JP", sans-serif; }
  h1 { margin: 0; font-size: 28px; letter-spacing: 0.04em; }
  p { margin: 6px 0 32px; font-size: 15px; color: #666; }
  .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 36px 32px; }
  figure { margin: 0; }
  img { display: block; width: 100%; height: auto; filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.18)); }
  figcaption { margin-top: 12px; text-align: center; font-size: 17px; }
</style><body>
<h1>${event.title}　招待カード　クラス別の配色一覧</h1>
<p>${event.subtitle}　／　宛名は伏字のサンプルです</p>
<div class="grid">${tiles.join('')}</div>
</body></html>`;

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1360, height: 800 }, deviceScaleFactor: 2 });
  await page.setContent(html);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => [...document.images].every((i) => i.complete));
  await writeFile(outFile, await page.screenshot({ fullPage: true, type: 'png' }));
} finally {
  await browser.close();
}
console.log(outFile.replace(root + '/', ''));
