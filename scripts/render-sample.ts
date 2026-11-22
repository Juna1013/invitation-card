/**
 * サンプル PNG 生成（サンプル名簿から各クラス1人＋長い氏名の1人）。
 * 実行: npm run sample  →  samples/cards/ に出力
 *
 * 本番の生成コマンド（設定ファイル・検証・書き戻し）は別途。ここは見た目の確認用。
 */
import { mkdir, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { createServer } from 'vite';
import type { EventInfo } from '../src/card/Card';
import { formatNo } from '../src/domain/format';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = resolve(root, 'samples/cards');

const event: EventInfo = {
  school: '○○中学校',
  title: '成人式 同窓会',
  year: 2027,
  startsAt: '2027-01-11 18:00',
  fee: '5,000円',
  rsvpUrl: 'https://example.com/rsvp', // サンプル用のダミー（example.com は予約ドメイン）
};

// クラス順に プリセットを割り当てる（設計書 §9）
const classColors: Record<string, string> = {
  '3年1組': '桜',
  '3年2組': '若草',
  '3年3組': '翡翠',
  '3年4組': '空',
  '3年5組': '藤',
  '3年6組': '朱',
  '3年7組': '紺',
  '3年8組': '金',
  '3年9組': '墨',
};

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

// 各クラスの先頭1人 ＋ 長い氏名の1人
const firstOfClass = Object.keys(classColors).map((c) => people.find((p) => p.className === c)!);
const longName = people.reduce((a, b) => (b.name.length > a.name.length ? b : a));
const targets = [...new Set([...firstOfClass, longName])];

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
    const { minContrast } = await page.evaluate((args) => window.renderCard(args), { event, person, color });
    const file = resolve(outDir, `${formatNo(person.no)}_${person.className}_${person.name.replace(/\s|　/g, '')}.png`);
    await page.locator('.sheet').screenshot({ path: file, omitBackground: true, type: 'png' });
    console.log(`${file.replace(root + '/', '')}  (${color}, contrast ${minContrast.toFixed(1)})`);
  }
} finally {
  await browser.close();
  await server.close();
}
