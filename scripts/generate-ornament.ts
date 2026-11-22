/**
 * 「雲と花」の飾り SVG を一から生成する → src/assets/ornament/cloud-flowers.svg
 *
 *   右上と左下の端から入る雲（横長のカプセル形を段々に重ね、先端を二重線の曲線で巻く）と、
 *   雲に添える花（梅・桜・菊・輪花）。すべて自作の幾何学図形。
 *
 * 座標はカード（500x740 px）と 1:1。色は付けない（カード側で CSS の mask に使い、文字色 --ink で塗る）。
 * 重なる部分は SVG の mask で切り抜く（雲の線は花の中に透けない。後から描く花が手前になる）。
 * 実行: npm run ornament
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const W = 500;
const H = 740;

const f = (n: number) => n.toFixed(2);
const rad = (d: number) => (d * Math.PI) / 180;
const polar = (r: number, deg: number) => [Math.cos(rad(deg)) * r, Math.sin(rad(deg)) * r] as const;
const seq = (n: number) => Array.from({ length: n }, (_, i) => i);

// ---------------------------------------------------------------- 雲

type Layer = { y: number; end: number; r: number };

/**
 * 画面の端（edge）から入る雲の1段。
 * 端から伸びた2本の水平線が、先端（end）で半円につながるカプセル形。内側に、少しずらした小さな半円をもう1本引く。
 */
function cloudLayer(edge: 'left' | 'right', { y, end, r }: Layer): string {
  const sgn = edge === 'right' ? 1 : -1; // 端から内側へ向かう向きの逆（右端なら左へ伸びる）
  const far = edge === 'right' ? W + 12 : -12; // 画面の外まで伸ばす
  const cap = end + sgn * r; // 半円の付け根
  const sweepOut = edge === 'right' ? 0 : 1;
  const outline = `M${f(far)} ${f(y - r)} H${f(cap)} A${r} ${r} 0 0 ${sweepOut} ${f(cap)} ${f(y + r)} H${f(far)}`;
  const ri = r * 0.58;
  const ic = cap + sgn * r * 0.9; // 内側の半円の付け根（外側より内へずらす）
  const inner = `M${f(ic)} ${f(y - ri)} A${f(ri)} ${f(ri)} 0 0 ${sweepOut} ${f(ic)} ${f(y + ri)}`;
  return `<path d="${outline}"/><path d="${inner}"/>`;
}

/** 最上段の1本線 */
function topLine(edge: 'left' | 'right', y: number, end: number): string {
  const far = edge === 'right' ? W + 12 : -12;
  return `<path d="M${f(end)} ${f(y)} H${f(far)}"/>`;
}

// ---------------------------------------------------------------- 花

type Kind = 'ume' | 'sakura' | 'kiku' | 'rin';
type FlowerSpec = { kind: Kind; x: number; y: number; r: number; rot?: number };

/** 梅：丸い花びら5枚（外形＋内側の曲線）、中心の円とおしべの点 */
function ume(r: number): string {
  const parts = seq(5).map((i) => {
    const dir = i * 72 - 90;
    const [cx, cy] = polar(r * 0.56, dir);
    const [ax, ay] = polar(r * 0.3, dir - 85);
    const [bx, by] = polar(r * 0.3, dir + 85);
    // 花びらの内側の曲線：花びらの中心から見て外側に膨らむ弧
    const ex = cx + ax;
    const ey = cy + ay;
    const gx = cx + bx;
    const gy = cy + by;
    return (
      `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r * 0.47)}"/>` +
      `<path d="M${f(ex)} ${f(ey)} A${f(r * 0.3)} ${f(r * 0.3)} 0 0 1 ${f(gx)} ${f(gy)}"/>`
    );
  });
  const dots = seq(10).map((i) => {
    const [x, y] = polar(r * 0.3, i * 36);
    return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * 0.03)}"/>`;
  });
  return parts.join('') + `<circle r="${f(r * 0.19)}"/>` + dots.join('');
}

/** 桜：先端に切れ込みのある花びら5枚（花びらごとに筋）、おしべの点 */
function sakura(r: number): string {
  const petal =
    `M0 0 C${f(-0.52 * r)} ${f(-0.25 * r)} ${f(-0.58 * r)} ${f(-0.88 * r)} ${f(-0.2 * r)} ${f(-r)} ` +
    `L0 ${f(-0.82 * r)} L${f(0.2 * r)} ${f(-r)} C${f(0.58 * r)} ${f(-0.88 * r)} ${f(0.52 * r)} ${f(-0.25 * r)} 0 0Z`;
  const ps = seq(5).map(
    (i) => `<g transform="rotate(${i * 72})"><path d="${petal}"/><path d="M0 ${f(-0.18 * r)} L0 ${f(-0.62 * r)}"/></g>`,
  );
  const dots = seq(10).map((i) => {
    const [x, y] = polar(r * 0.3, i * 36 + 18);
    return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * 0.035)}"/>`;
  });
  return ps.join('') + dots.join('');
}

/** 菊：細長い花びらを2重に並べた花 */
function kiku(r: number): string {
  const outer = seq(18).map(
    (i) => `<ellipse cx="0" cy="${f(-r * 0.68)}" rx="${f(r * 0.09)}" ry="${f(r * 0.3)}" transform="rotate(${i * 20})"/>`,
  );
  const inner = seq(9).map(
    (i) => `<ellipse cx="0" cy="${f(-r * 0.4)}" rx="${f(r * 0.08)}" ry="${f(r * 0.17)}" transform="rotate(${i * 40 + 20})"/>`,
  );
  return outer.join('') + inner.join('') + `<circle r="${f(r * 0.14)}"/>`;
}

/** 輪花：縁取りの小さな丸、二重の円、その間の放射線、中心のおしべの輪 */
function rin(r: number): string {
  const edge = seq(14).map((i) => {
    const [x, y] = polar(r * 0.88, i * (360 / 14));
    return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * 0.13)}"/>`;
  });
  const rays = seq(30).map((i) => {
    const [x1, y1] = polar(r * 0.38, i * 12);
    const [x2, y2] = polar(r * 0.7, i * 12);
    return `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}"/>`;
  });
  const dots = seq(8).map((i) => {
    const [x, y] = polar(r * 0.2, i * 45 + 22);
    return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * 0.03)}"/>`;
  });
  return edge.join('') + `<circle r="${f(r * 0.74)}"/><circle r="${f(r * 0.34)}"/>` + rays.join('') + dots.join('');
}

const drawFlower = (k: Kind, r: number) => ({ ume, sakura, kiku, rin })[k](r);

// ---------------------------------------------------------------- 配置

const RIGHT_LAYERS: Layer[] = [
  { y: 142, end: 424, r: 10 },
  { y: 172, end: 380, r: 12 },
  { y: 202, end: 406, r: 10 },
  { y: 232, end: 352, r: 12 },
  { y: 262, end: 394, r: 9 },
];
const LEFT_LAYERS: Layer[] = [
  { y: 414, end: 76, r: 10 },
  { y: 444, end: 120, r: 12 },
  { y: 474, end: 92, r: 10 },
  { y: 504, end: 144, r: 12 },
  { y: 534, end: 106, r: 9 },
];

/** 花は先に書いたものが奥、後に書いたものが手前 */
const FLOWERS: FlowerSpec[] = [
  // 右の雲：下の段に添える
  { kind: 'ume', x: 408, y: 246, r: 33, rot: 8 },
  { kind: 'kiku', x: 466, y: 262, r: 26 },
  { kind: 'sakura', x: 452, y: 208, r: 19, rot: 20 },
  { kind: 'rin', x: 372, y: 214, r: 16 },
  { kind: 'ume', x: 490, y: 224, r: 11, rot: 30 },
  { kind: 'sakura', x: 436, y: 292, r: 10, rot: -10 },
  // 左の雲：下の段に添える
  { kind: 'ume', x: 100, y: 508, r: 33, rot: 14 },
  { kind: 'rin', x: 44, y: 536, r: 25 },
  { kind: 'sakura', x: 144, y: 468, r: 18, rot: 28 },
  { kind: 'kiku', x: 24, y: 478, r: 15 },
  { kind: 'ume', x: 138, y: 548, r: 10, rot: 20 },
  { kind: 'sakura', x: 70, y: 468, r: 10, rot: -16 },
];

// ---------------------------------------------------------------- 組み立て

const hole = (fl: FlowerSpec) => `<circle cx="${fl.x}" cy="${fl.y}" r="${f(fl.r * 1.03)}" fill="#000"/>`;
const maskDef = (id: string, holes: FlowerSpec[]) =>
  `<mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#fff"/>${holes.map(hole).join('')}</mask>`;

const masks = [
  maskDef('cloud-mask', FLOWERS), // 雲：すべての花の下
  ...FLOWERS.map((_, i) => maskDef(`flower-mask-${i}`, FLOWERS.slice(i + 1))), // 花：手前の花の下
].join('\n  ');

const clouds =
  topLine('right', 112, 452) +
  RIGHT_LAYERS.map((l) => cloudLayer('right', l)).join('') +
  topLine('left', 386, 56) +
  LEFT_LAYERS.map((l) => cloudLayer('left', l)).join('');

const flowers = FLOWERS.map(
  (fl, i) =>
    `<g mask="url(#flower-mask-${i})"><g transform="translate(${fl.x} ${fl.y}) rotate(${fl.rot ?? 0})">${drawFlower(fl.kind, fl.r)}</g></g>`,
).join('\n  ');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" fill="none" stroke="#000" stroke-linecap="round" stroke-linejoin="round">
<title>雲と花（線画）</title>
<defs>
  ${masks}
</defs>
<g stroke-width="2.2" stroke-opacity="0.6" mask="url(#cloud-mask)">${clouds}</g>
<g stroke-width="1.6">
  ${flowers}
</g>
</svg>
`;

const outDir = resolve(root, 'src/assets/ornament');
mkdirSync(outDir, { recursive: true });
writeFileSync(resolve(outDir, 'cloud-flowers.svg'), svg);
console.log('generated src/assets/ornament/cloud-flowers.svg');
