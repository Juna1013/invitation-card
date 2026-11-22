/**
 * 柵（和風の欄干）の SVG を生成する → src/assets/fence/fence.svg
 *   擬宝珠（ぎぼし）形の頭をもつ親柱と、2本の横木、その間の筋交い（ジグザグの格子）。
 * 幅 500（カードの幅）× 高さ 60。色は付けない（カード側で CSS の mask に使い、文字色 --ink で塗る）。
 * 実行: npm run fence
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const W = 500;
const H = 60;
const POSTS = 6;
const X0 = 22; // 最初の親柱の中心
const STEP = (W - 2 * X0) / (POSTS - 1);

const RAIL_TOP = 26;
const RAIL_BOTTOM = 44;
const RAIL_H = 4;

/** 親柱（中心 x=0、下端 y=H）。擬宝珠の頭・首輪・首・柱身・台座 */
const post = `<g id="post">
    <path d="M-6 14 C-9.5 9 -4.5 2.5 0 0 C4.5 2.5 9.5 9 6 14Z"/>
    <rect x="-7.5" y="14" width="15" height="3.4" rx="1.7"/>
    <rect x="-4" y="17.4" width="8" height="3"/>
    <rect x="-5" y="20.4" width="10" height="33.6"/>
    <rect x="-8.5" y="54" width="17" height="6" rx="1"/>
  </g>`;

/** 隣り合う親柱のあいだの筋交い（横木の間を斜めに往復する線を、半周期ずらして2本） */
function lattice(xFrom: number, xTo: number): string {
  const y0 = RAIL_TOP + RAIL_H;
  const y1 = RAIL_BOTTOM;
  const step = 9;
  const pts = (offset: number) => {
    const out: string[] = [];
    for (let x = xFrom, i = offset; x <= xTo + 0.01; x += step, i++) out.push(`${x.toFixed(1)} ${i % 2 ? y1 : y0}`);
    return 'M' + out.join(' L');
  };
  return `<path d="${pts(0)}"/><path d="${pts(1)}"/>`;
}

let body = '';
for (let i = 0; i < POSTS - 1; i++) {
  const a = X0 + i * STEP + 8;
  const b = X0 + (i + 1) * STEP - 8;
  body += lattice(a, b);
}

const uses = Array.from({ length: POSTS }, (_, i) => `<use href="#post" x="${(X0 + i * STEP).toFixed(1)}"/>`).join('');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<title>柵（和風の欄干）</title>
<defs>
  ${post}
</defs>
<g fill="#000">
  <rect x="0" y="${RAIL_TOP}" width="${W}" height="${RAIL_H}"/>
  <rect x="0" y="${RAIL_BOTTOM}" width="${W}" height="${RAIL_H}"/>
  ${uses}
</g>
<g fill="none" stroke="#000" stroke-width="1.5" stroke-linejoin="round">${body}</g>
</svg>
`;

const outDir = resolve(root, 'src/assets/fence');
mkdirSync(outDir, { recursive: true });
writeFileSync(resolve(outDir, 'fence.svg'), svg);
console.log('generated src/assets/fence/fence.svg');
