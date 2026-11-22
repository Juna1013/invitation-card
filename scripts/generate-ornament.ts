/**
 * 「霞と花」の飾り SVG を一から生成する → src/assets/ornament/cloud-flowers.svg
 *
 *   右上と左下の端から入る霞（すやり霞：先端がきれいに丸い細長い横帯を、段々にずらして重ねる）と、
 *   霞に寄り集まって咲く梅の線画（重ね梅・しべ梅・ねじ梅・小梅など）。すべて自作の幾何学図形。
 *   形の根拠: 霞は「工」「王」の字のように様式化された、横に広がる帯。13世紀以降、帯の先端を丸く、
 *   輪郭をくっきり描くようになった（すやり霞＝槍霞）。出典: JAANUS「kasumi」
 *   https://projects.mcah.columbia.edu/jaanus/record/kasumi
 *
 * 座標はカード（500x740 px）と 1:1。色は付けない（カード側で CSS の mask に使い、文字色 --ink で塗る）。
 * 重なりは SVG の mask で切り抜く：要素を奥から順に積み、要素を1つ足すたびに、それまでの全体を
 * その要素の外形（シルエット）で切り抜く（後に描いたものが手前になり、奥の線は透けない）。
 * 乱数は使わない（毎回同じ SVG になる）。
 * 実行: npm run ornament
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const W = 500;
const H = 740;

const f = (n: number) => (Math.round(n * 100) / 100).toString();
const rad = (d: number) => (d * Math.PI) / 180;
const polar = (r: number, deg: number) => [Math.cos(rad(deg)) * r, Math.sin(rad(deg)) * r] as const;
const seq = (n: number) => Array.from({ length: n }, (_, i) => i);
const pt = (r: number, deg: number) => polar(r, deg).map(f).join(' ');

/** 奥から順に積む要素。draw = 見える線、sil = 手前に来たときに奥を隠す外形（黒で塗る） */
type Item = { draw: string; sil: string };

// ---------------------------------------------------------------- 霞

/**
 * 霞雲：細長い横帯（先端が丸い）を3〜4段、左右交互にずらして積み、上下の段を細いくびれ（凹んだ丸い
 * つなぎ）で結んだ、ひと続きの閉じた輪郭（工・王の字のような形）。内側の線は描かない。
 * 帯の端が画面の外（x<0 / x>W）にあれば、その端は丸めずに画面外で閉じる（画面の端から入ってくる）。
 */
type Tier = { top: number; a: number; b: number }; // 帯の上端 y と、左端 a・右端 b
type Cloud = { tiers: Tier[]; necks: number[]; t: number; gap: number; neck: number };

function cloudPath({ tiers, necks, t, gap, neck }: Cloud): string {
  const r = t / 2;
  const rf = gap / 2; // くびれの凹んだ丸み（上下の帯の縁に接する円）
  const nh = neck / 2;
  const off = (x: number) => x < 0 || x > W;
  const bot = (i: number) => tiers[i].top + t;
  const n = tiers.length;
  const t0 = tiers[0];
  let d = `M${f(off(t0.a) ? t0.a : t0.a + r)} ${f(t0.top)}`;
  const rightEnd = (i: number) => {
    const { b, top } = tiers[i];
    d += off(b) ? ` H${f(b)} V${f(bot(i))}` : ` H${f(b - r)} A${f(r)} ${f(r)} 0 0 1 ${f(b - r)} ${f(bot(i))}`;
  };
  const leftEnd = (i: number) => {
    const { a, top } = tiers[i];
    d += off(a) ? ` H${f(a)} V${f(top)}` : ` H${f(a + r)} A${f(r)} ${f(r)} 0 0 1 ${f(a + r)} ${f(top)}`;
  };
  // 右側を下へ
  for (let i = 0; i < n; i++) {
    rightEnd(i);
    if (i < n - 1) {
      const x = necks[i] + nh + rf;
      d += ` H${f(x)} A${f(rf)} ${f(rf)} 0 0 0 ${f(x)} ${f(tiers[i + 1].top)}`;
    }
  }
  // 左側を上へ
  for (let i = n - 1; i >= 0; i--) {
    leftEnd(i);
    if (i > 0) {
      const x = necks[i - 1] - nh - rf;
      d += ` H${f(x)} A${f(rf)} ${f(rf)} 0 0 0 ${f(x)} ${f(bot(i - 1))}`;
    }
  }
  return d + 'Z';
}

function cloudItem(c: Cloud): Item {
  const d = cloudPath(c);
  return {
    draw: `<path d="${d}" stroke-width="2.5" stroke-opacity="0.78"/>`,
    sil: `<path d="${d}" stroke="#000" stroke-width="5"/>`,
  };
}

// ---------------------------------------------------------------- 花（梅）

/** 花びらの中心までの距離 D と花びらの半径 P（どちらも花の半径 R に対する比） */
const D = 0.5;
const P = 0.5;

/** 隣り合う花びら（円）の交点のうち外側の点までの距離（R に対する比） */
const notch = (d: number, p: number) => d * Math.cos(rad(36)) + Math.sqrt(p * p - (d * Math.sin(rad(36))) ** 2);

/** 5枚の丸い花びらを合わせた外形（花びら同士の内側の線は描かない、ひと筆の輪郭） */
function umeOutline(R: number, d = D, p = P): string {
  const t = notch(d, p) * R;
  const pr = p * R;
  // 花びら1枚の外側の弧が中心から見て何度か（180 度を超えれば large-arc）
  const [cx, cy] = [d * R, 0];
  const [qx, qy] = polar(t, 36);
  const half = Math.atan2(qy - cy, qx - cx);
  const large = 2 * (Math.PI - half) > Math.PI ? 1 : 0;
  let path = `M${pt(t, -90 - 36)}`;
  for (const i of seq(5)) path += ` A${f(pr)} ${f(pr)} 0 ${large} 1 ${pt(t, i * 72 - 90 + 36)}`;
  return `<path d="${path}Z"/>`;
}

/** 花の外形（切り抜き用）：花びらの円をすべて塗る。線幅の分だけ少し太らせる */
function umeSil(R: number, d = D, p = P): string {
  return seq(5)
    .map((i) => {
      const [x, y] = polar(d * R, i * 72 - 90);
      return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(p * R + 1.6)}"/>`;
    })
    .join('') + `<circle r="${f(d * R)}"/>`;
}

/** 中心から花びらの切れ目へ伸びる線（重ね梅の手前の花） */
const notchLines = (R: number, from = 0) =>
  seq(5)
    .map((i) => `<path d="M${pt(from * R, i * 72 - 54)} L${pt(notch(D, P) * R * 0.97, i * 72 - 54)}"/>`)
    .join('');

/** 中心の小さな円 */
const pistil = (r: number) => `<circle r="${f(r)}"/>`;

/** 放射状のしべ：中心の円から外へ細い線、先に小さな点。長短を交互に */
function stamens(R: number, n = 16): string {
  return seq(n)
    .map((i) => {
      const a = (i * 360) / n;
      const len = i % 2 === 0 ? 0.47 : 0.38;
      const [x, y] = polar(len * R, a);
      return (
        `<path d="M${pt(0.14 * R, a)} L${f(x)} ${f(y)}" stroke-width="1.05"/>` +
        `<circle cx="${f(x)}" cy="${f(y)}" r="${f(Math.max(0.9, 0.035 * R))}" fill="#000" stroke="none"/>`
      );
    })
    .join('');
}

/** ねじ梅の、中心から各花びらへ渦を巻くように伸びる曲線 */
function swirls(R: number): string {
  return seq(5)
    .map((i) => {
      const a = i * 72 - 90;
      return `<path d="M${pt(0.15 * R, a - 20)} Q${pt(0.42 * R, a - 8)} ${pt(0.66 * R, a + 22)}"/>`;
    })
    .join('');
}

/** 花びらの付け根の小さなしずく形（小梅の模様） */
function drops(R: number): string {
  return seq(5)
    .map((i) => {
      const a = i * 72 - 90;
      const [x, y] = polar(0.3 * R, a);
      return `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(Math.max(0.8, 0.045 * R))}" ry="${f(Math.max(1.5, 0.09 * R))}" transform="rotate(${f(a + 90)} ${f(x)} ${f(y)})" fill="#000" stroke="none"/>`;
    })
    .join('');
}

type Kind =
  | 'kasane' // 重ね梅：奥にずらした花、手前に切れ目の線のある花
  | 'kasaneShibe' // 重ね梅（手前にしべ）
  | 'shibe' // しべ梅：外形＋中心の円＋放射状のしべ
  | 'neji' // ねじ梅：中心の円から渦巻く線
  | 'komon' // 小梅：外形としずく形
  | 'ko'; // 小花：外形＋中心の円
type FlowerSpec = { kind: Kind; x: number; y: number; r: number; rot?: number };

const place = (fl: FlowerSpec, rot: number, body: string) =>
  `<g transform="translate(${fl.x} ${fl.y}) rotate(${f(rot)})">${body}</g>`;

function flowerItems(fl: FlowerSpec): Item[] {
  const R = fl.r;
  const rot = fl.rot ?? 0;
  const item = (r: number, body: string, dr = 0): Item => ({
    draw: place(fl, rot + dr, body),
    sil: place(fl, rot + dr, umeSil(r)),
  });
  switch (fl.kind) {
    case 'kasane':
      return [item(R, umeOutline(R), 36), item(R * 0.84, umeOutline(R * 0.84) + notchLines(R * 0.84))];
    case 'kasaneShibe':
      return [
        item(R, umeOutline(R), 36),
        item(R * 0.86, umeOutline(R * 0.86) + pistil(R * 0.1) + stamens(R * 0.86, 18)),
      ];
    case 'shibe':
      return [item(R, umeOutline(R) + pistil(R * 0.1) + stamens(R, 14))];
    case 'neji':
      return [item(R, umeOutline(R) + pistil(R * 0.11) + swirls(R))];
    case 'komon':
      return [item(R, umeOutline(R) + drops(R))];
    case 'ko':
      return [item(R, umeOutline(R) + pistil(R * 0.16))];
  }
}

// ---------------------------------------------------------------- 配置

/** 右上：右の端から入る霞（1・3段目は画面外へ抜け、2・4段目は左右とも丸い頭） */
const RIGHT_CLOUD: Cloud = {
  t: 17,
  gap: 12,
  neck: 8,
  tiers: [
    { top: 130, a: 372, b: W + 20 },
    { top: 159, a: 304, b: 458 },
    { top: 188, a: 384, b: W + 20 },
    { top: 217, a: 342, b: 448 },
  ],
  necks: [402, 428, 404],
};
/** 左下：左の端から入る霞（右上の霞を左右反転した段の並び） */
const LEFT_CLOUD: Cloud = {
  t: 17,
  gap: 12,
  neck: 8,
  tiers: [
    { top: 400, a: -20, b: 104 },
    { top: 429, a: 26, b: 146 },
    { top: 458, a: -20, b: 110 },
    { top: 487, a: 40, b: 162 },
  ],
  necks: [70, 56, 80],
};

/** 花は先に書いたものが奥、後に書いたものが手前 */
const RIGHT_FLOWERS: FlowerSpec[] = [
  { kind: 'komon', x: 494, y: 110, r: 13, rot: 10 },
  { kind: 'kasane', x: 466, y: 150, r: 22, rot: -6 },
  { kind: 'ko', x: 398, y: 190, r: 10, rot: 14 },
  { kind: 'shibe', x: 486, y: 206, r: 21, rot: 4 },
  { kind: 'ko', x: 452, y: 206, r: 9, rot: -20 },
  { kind: 'kasaneShibe', x: 436, y: 250, r: 27, rot: 2 },
  { kind: 'neji', x: 380, y: 266, r: 17, rot: 18 },
  { kind: 'komon', x: 407, y: 287, r: 11, rot: -12 },
  { kind: 'kasane', x: 484, y: 276, r: 19, rot: 24 },
];
const LEFT_FLOWERS: FlowerSpec[] = [
  { kind: 'ko', x: 140, y: 448, r: 10, rot: 8 },
  { kind: 'kasane', x: 36, y: 470, r: 23, rot: 12 },
  { kind: 'shibe', x: 108, y: 496, r: 23, rot: -4 },
  { kind: 'komon', x: 72, y: 492, r: 11, rot: 30 },
  { kind: 'neji', x: 56, y: 529, r: 20, rot: -10 },
  { kind: 'kasaneShibe', x: 144, y: 533, r: 20, rot: 20 },
  { kind: 'komon', x: 14, y: 545, r: 12, rot: 0 },
  { kind: 'ko', x: 101, y: 546, r: 10, rot: -16 },
];

// ---------------------------------------------------------------- 組み立て

const items: Item[] = [
  cloudItem(RIGHT_CLOUD),
  cloudItem(LEFT_CLOUD),
  ...[...RIGHT_FLOWERS, ...LEFT_FLOWERS].flatMap(flowerItems),
];

// 要素を1つ足すたびに、それまでの全体をその要素の外形で切り抜く（入れ子の mask）
const masks: string[] = [];
let body = '';
items.forEach((it, i) => {
  if (i > 0) {
    masks.push(
      `<mask id="m${i}" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#fff"/><g fill="#000" stroke="none">${it.sil}</g></mask>`,
    );
    body = `<g mask="url(#m${i})">${body}</g>`;
  }
  body += `\n${it.draw}`;
});

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" fill="none" stroke="#000" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
<title>霞と花（線画）</title>
<defs>
${masks.join('\n')}
</defs>
${body}
</svg>
`;

const outDir = resolve(root, 'src/assets/ornament');
mkdirSync(outDir, { recursive: true });
writeFileSync(resolve(outDir, 'cloud-flowers.svg'), svg);
console.log('generated src/assets/ornament/cloud-flowers.svg');
