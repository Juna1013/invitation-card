/**
 * サンプル PNG 生成（サンプル名簿から各クラス1人＋長い氏名の1人。氏名は伏字）。
 * 実行: npm run sample  →  samples/cards/ に出力
 *
 * 本番の生成コマンド（設定ファイル・検証・書き戻し）は別途。ここは見た目の確認用。
 */
import { mkdir, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { createServer } from 'vite';
import { loadConfig } from '../src/domain/config';
import { formatNo } from '../src/domain/format';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = resolve(root, 'samples/cards');

// 文言・クラスごとの配色（設計書 §9）は card.yaml で管理する。教職員は「クラス」欄に「教職員」と入る想定
const { event, labels, classColors } = await loadConfig(resolve(root, 'card.yaml'));

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

// サンプル画像には氏名を出さず、伏字にする。通常は「〇〇 〇〇」。
// 最長の氏名だけは、宛名の縮小動作を確認するため、文字数と空白を保って伏字にする
const maskName = (name: string, keepLength: boolean) => (keepLength ? name.replace(/[^\s　]/g, '〇') : '〇〇 〇〇');

// 各クラスの先頭1人 ＋ 長い氏名の1人
const firstOfClass = Object.keys(classColors).map((c) => people.find((p) => p.className === c)!);
const longName = people.reduce((a, b) => (b.name.length > a.name.length ? b : a));
const targets = [...new Set([...firstOfClass, longName])].map((p) => ({ ...p, name: maskName(p.name, p === longName) }));

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
    const file = resolve(outDir, `${formatNo(person.no)}_${person.className}_${person.name.replace(/\s|　/g, '')}.png`);
    await page.locator('.sheet').screenshot({ path: file, omitBackground: true, type: 'png' });
    console.log(`${file.replace(root + '/', '')}  (${color}, contrast ${minContrast.toFixed(1)})`);
  }
} finally {
  await browser.close();
  await server.close();
}
