import { readFile } from 'node:fs/promises';
import { parse } from 'yaml';
import type { CardLabels, EventInfo } from '../card/Card';
import { formatDateDotted, formatTime } from './format';
import { resolveColor } from './theme';

/** card.yaml の内容（検証済み） */
export type CardConfig = {
  event: EventInfo;
  labels: CardLabels;
  classColors: Record<string, string>;
};

const LABEL_KEYS = {
  guest_no: 'guestNo',
  recipient: 'recipient',
  datetime: 'datetime',
  class: 'className',
  honorific: 'honorific',
} as const satisfies Record<string, keyof CardLabels>;

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** 必須の文字列項目を取り出す（空文字は不可） */
function requireString(obj: Record<string, unknown>, key: string, path: string): string {
  const v = obj[key];
  if (typeof v !== 'string' || v.trim() === '') throw new Error(`${path}.${key} は空でない文字列で指定してください`);
  return v;
}

/** YAML の文字列を検証して CardConfig にする。不備はすべてまとめて報告する */
export function parseConfig(source: string): CardConfig {
  const errors: string[] = [];
  const collect = <T>(fn: () => T, fallback: T): T => {
    try {
      return fn();
    } catch (e) {
      errors.push((e as Error).message);
      return fallback;
    }
  };

  const raw: unknown = parse(source);
  if (!isObject(raw)) throw new Error('設定ファイルの最上位はキーと値の組で記述してください');

  const ev = isObject(raw.event) ? raw.event : {};
  if (!isObject(raw.event)) errors.push('event を指定してください');
  const title = collect(() => requireString(ev, 'title', 'event'), '');
  const subtitle = collect(() => requireString(ev, 'subtitle', 'event'), '');
  // 日付・時刻は書式まで検証し、不備には項目名を付けて報告する
  const dateTime = (key: string, check: (v: string) => unknown) =>
    collect(() => {
      const v = requireString(ev, key, 'event');
      try {
        check(v);
      } catch (e) {
        throw new Error(`event.${key}: ${(e as Error).message}`);
      }
      return v;
    }, '');
  const date = dateTime('date', formatDateDotted);
  const startTime = dateTime('start_time', formatTime);
  const endTime = dateTime('end_time', formatTime);

  const lb = isObject(raw.labels) ? raw.labels : {};
  if (!isObject(raw.labels)) errors.push('labels を指定してください');
  const labels = {} as CardLabels;
  for (const [yamlKey, prop] of Object.entries(LABEL_KEYS)) {
    labels[prop] = collect(() => requireString(lb, yamlKey, 'labels'), '');
  }

  const cc = isObject(raw.class_colors) ? raw.class_colors : {};
  if (!isObject(raw.class_colors)) errors.push('class_colors を指定してください');
  const classColors: Record<string, string> = {};
  for (const [cls, color] of Object.entries(cc)) {
    if (typeof color !== 'string') {
      errors.push(`class_colors.${cls} は配色名または #rrggbb の文字列で指定してください`);
      continue;
    }
    collect(() => resolveColor(color), '');
    classColors[cls] = color;
  }

  if (errors.length > 0) throw new Error(`設定ファイルの不備:\n${errors.map((e) => `  - ${e}`).join('\n')}`);

  return {
    event: { title, subtitle, date, startTime, endTime },
    labels,
    classColors,
  };
}

export async function loadConfig(path: string): Promise<CardConfig> {
  return parseConfig(await readFile(path, 'utf8'));
}
