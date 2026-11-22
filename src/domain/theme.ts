/** 配色プリセット（設定ファイルからは名前で参照する） */
export const PRESETS: Record<string, string> = {
  桜: '#e8a0b4',
  若草: '#7db46c',
  翡翠: '#3aa38f',
  空: '#5b9bd5',
  藤: '#8e7cc3',
  朱: '#d9534f',
  紺: '#1f3a5f',
  金: '#c9a227',
  墨: '#2b2b2b',
};

type RGB = [number, number, number];

const toRgb = (hex: string): RGB => {
  const h = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as RGB;
};
const toHex = (c: RGB) => '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
const mix = (a: string, b: string, t: number) => {
  const x = toRgb(a);
  const y = toRgb(b);
  return toHex(x.map((v, i) => v + (y[i] - v) * t) as RGB);
};
const luminance = (hex: string) => {
  const [r, g, b] = toRgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (hi + 0.05) / (lo + 0.05);
};
const alpha = (hex: string, a: number) => `rgba(${toRgb(hex).join(',')},${a})`;

/** プリセット名 or #rrggbb を色コードに解決する */
export function resolveColor(nameOrHex: string): string {
  if (PRESETS[nameOrHex]) return PRESETS[nameOrHex];
  if (/^#[0-9a-fA-F]{6}$/.test(nameOrHex)) return nameOrHex.toLowerCase();
  throw new Error(`不明な配色: ${nameOrHex}`);
}

export type ThemeTokens = Record<`--${string}`, string>;

/** 配色1色から、カードに注入する CSS 変数を導出する（前景色はコントラストで自動選択） */
export function deriveTheme(color: string): { tokens: ThemeTokens; fg: string; minContrast: number } {
  // 前景色ごとに、コントラストを損なう側のグラデーション幅を狭める
  //   白文字: 明るい側を抑える / 濃色文字: 暗い側を抑える
  const candidates = [
    { fg: '#ffffff', from: mix(color, '#ffffff', 0.06), to: mix(color, '#000000', 0.3) },
    { fg: '#111111', from: mix(color, '#ffffff', 0.2), to: mix(color, '#000000', 0.06) },
  ].map((c) => ({ ...c, min: Math.min(contrast(c.fg, c.from), contrast(c.fg, c.to)) }));
  const { fg, from, to, min: minContrast } = candidates[0].min >= candidates[1].min ? candidates[0] : candidates[1];
  return {
    fg,
    minContrast,
    tokens: {
      '--card-from': from,
      '--card-to': to,
      '--card-fg': fg,
      '--card-fg-80': alpha(fg, 0.8),
      '--card-fg-65': alpha(fg, 0.65),
      '--card-fg-35': alpha(fg, 0.35),
      '--card-fg-16': alpha(fg, 0.16),
      '--card-fg-10': alpha(fg, 0.1),
    },
  };
}
