/** 配色プリセット（設定ファイルからは名前で参照する） */
export const PRESETS: Record<string, string> = {
  白: '#ffffff',
  黄: '#f2c744',
  緑: '#4caf63',
  朱: '#df4a2c',
  橙: '#f08a24',
  青: '#2f6fd0',
  紫: '#7b4fc1',
  ピンク: '#f08fb0',
  黒: '#1c1c1e',
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

/** プリセット名 or #rrggbb を色コードに解決する */
export function resolveColor(nameOrHex: string): string {
  if (PRESETS[nameOrHex]) return PRESETS[nameOrHex];
  if (/^#[0-9a-fA-F]{6}$/.test(nameOrHex)) return nameOrHex.toLowerCase();
  throw new Error(`不明な配色: ${nameOrHex}`);
}

/** 文字・線画の色を白にしないプリセット（暗い地色のものだけ） */
const PRESET_INK: Record<string, string> = {
  黒: '#d4af37', // 金
};

export type ThemeTokens = Record<`--${string}`, string>;

/** 暗い地色の上の文字（白・金など）が満たすコントラスト比 */
const TARGET_CONTRAST = 4.8;
/** 濃色文字（#111）とのコントラスト比がこれ以上なら「明るい地色」として扱う */
const LIGHT_THEME_MIN = 6;
const DARK_INK = '#111111';

/**
 * 配色（プリセット名 or #rrggbb）から、カードに注入する CSS 変数を導出する。
 *  - 明るい色（白・黄・緑・橙・ピンク）: 地色はそのまま、文字と線画は濃色
 *  - 暗い色（朱・青・紫・黒）: 文字と線画は白（黒は金）。その色が TARGET_CONTRAST を満たす最小限の暗さまで地色を暗くする
 */
export function deriveTheme(nameOrHex: string): { tokens: ThemeTokens; minContrast: number } {
  const color = resolveColor(nameOrHex);
  const onLight = contrast(DARK_INK, color);
  if (onLight >= LIGHT_THEME_MIN) {
    return {
      minContrast: onLight,
      tokens: {
        '--card-bg': color,
        '--ink': toRgb(DARK_INK).join(','),
        '--footer-bg': 'rgba(0,0,0,0.08)',
        '--art-strength': '0.5', // 濃色の線は白線より重く見えるので薄くする
      },
    };
  }
  const ink = PRESET_INK[nameOrHex] ?? '#ffffff';
  let bg = color;
  for (let t = 0; t <= 0.8; t += 0.02) {
    bg = mix(color, '#000000', t);
    if (contrast(ink, bg) >= TARGET_CONTRAST) break;
  }
  return {
    minContrast: contrast(ink, bg),
    tokens: {
      '--card-bg': bg,
      '--ink': toRgb(ink).join(','),
      '--footer-bg': 'rgba(0,0,0,0.3)', // フッターは半透明の黒（地色より一段暗い）
      '--art-strength': '1',
    },
  };
}
