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

/** 白文字がこの比率を満たす最小限の暗さまで、配色を暗くする */
const TARGET_CONTRAST = 4.8;

/**
 * 配色1色から、カードに注入する CSS 変数を導出する。
 * カードは常に白文字。背景の上端（文字が載る明るい側）が TARGET_CONTRAST を満たすまで暗くする。
 */
export function deriveTheme(color: string): { tokens: ThemeTokens; minContrast: number } {
  let top = color;
  for (let t = 0.1; t <= 0.8; t += 0.02) {
    top = mix(color, '#000000', t);
    if (contrast('#ffffff', top) >= TARGET_CONTRAST) break;
  }
  const bottom = mix(top, '#000000', 0.5);
  const accent = mix(color, '#ffffff', 0.35); // 太陽・アイコン円
  const iconFg = contrast('#111111', accent) > contrast('#ffffff', accent) ? '#111111' : '#ffffff';
  return {
    minContrast: Math.min(contrast('#ffffff', top), contrast('#ffffff', bottom)),
    tokens: {
      '--card-top': top,
      '--card-bottom': bottom,
      '--card-accent': accent,
      '--card-glow': alpha(accent, 0.45),
      '--icon-bg': accent,
      '--icon-fg': iconFg,
    },
  };
}
