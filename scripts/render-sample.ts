/**
 * サンプル PNG 生成（サンプル名簿から各クラス1人。氏名はすべて「〇〇 〇〇」の伏字）。
 * 実行: npm run sample  →  samples/cards/ に出力
*       npm run sample:pdf  →  場所欄がリンクになる PDF を samples/pdf/ に出力
 *       npm run sample:pdf  →  場所欄が地図へのリンクになる PDF を samples/pdf/ に出力
 *       npm run sample:public  →  語句を伏せた公開用を samples/public/cards/ に出力
 *
 * 本番の生成コマンド（設定ファイル・検証・書き戻し）は別途。ここは見た目の確認用。
 */
import { mkdir, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { createServer } from 'vite';
import { loadConfig, maskEvent } from '../src/domain/config';
import { formatNo } from '../src/domain/format';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// --public: 公開用（card.yaml の public_masks で語句を伏せる）。samples/public/cards/ に出力する
const isPublic = process.argv.includes('--public');
// --pdf: PNG の代わりに、場所欄が地図へのリンクになる PDF を出力する（card.yaml の event.map_url）
const isPdf = process.argv.includes('--pdf');
const outDir = resolve(root, isPdf ? 'samples/pdf' : isPublic ? 'samples/public/cards' : 'samples/cards');

// 文言・クラスごとの配色（設計書 §9）は card.yaml で管理する。教職員は「クラス」欄に「教職員」と入る想定
const config = await loadConfig(resolve(root, 'card.yaml'));
const { labels, classColors } = config;
const event = isPublic ? maskEvent(config.event, config.publicMasks) : config.event;

// 簡易パース（サンプル名簿はカンマを含まない前提）。通し番号は行順に 1 から
const text = (await readFile(resolve(root, 'samples/roster.sample.csv'), 'utf8')).replace(/^﻿/, '');
const people = text
  .trim()
  .split(/\r?\n/)
  .slice(1)
  .map((line, i) => {
    const [name, className] = line.split(',');
    return { name: name.trim(), className: className.trim(), no: i + 1 };
  });

// サンプル画像には氏名を出さず、氏名の長さにかかわらず「〇〇 〇〇」にする。各クラスの先頭1人を対象にする
const MASKED_NAME = '〇〇 〇〇';
const targets = Object.keys(classColors).map((c) => ({ ...people.find((p) => p.className === c)!, name: MASKED_NAME }));

await mkdir(outDir, { recursive: true });

const server = await createServer({ root, logLevel: 'error', server: { port: 5199 } });
await server.listen();
const url = `${server.resolvedUrls!.local[0]}render.html`;

const browser = await chromium.launch();
try {
  // 500x740 CSS px × 2.4 = 1200x1776 px
  const context = await browser.newContext({ viewport: { width: 500, height: 740 }, deviceScaleFactor: 2.4 });
  const page = await context.newPage();
  page.on('pageerror', (e) => console.error('[page error]', e.message));
  await page.goto(url);
  await page.waitForFunction(() => typeof window.renderCard === 'function');

  for (const person of targets) {
    const color = classColors[person.className];
    const { minContrast } = await page.evaluate((args) => window.renderCard(args), { event, labels, person, color });
    const base = `${formatNo(person.no)}_${person.className}_${person.name.replace(/\s|　/g, '')}`;
    const file = resolve(outDir, `${base}.${isPdf ? 'pdf' : 'png'}`);
    if (isPdf) {
      // カードと同じ 500x740 の1ページ。角丸の外は透明にする
      await page.pdf({ path: file, width: '500px', height: '740px', printBackground: true, pageRanges: '1', margin: { top: '0', right: '0', bottom: '0', left: '0' } });
    } else {
      await page.locator('.sheet').screenshot({ path: file, omitBackground: true, type: 'png' });
    }
    console.log(`${file.replace(root + '/', '')}  (${color}, contrast ${minContrast.toFixed(1)})`);
  }
} finally {
  await browser.close();
  await server.close();
}
