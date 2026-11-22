const WEEKDAYS = '日月火水木金土';

/** "2027-01-11 18:00" → "1月11日(月) 18:00" */
export function formatDateTime(s: string): string {
  const m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})[ T](\d{1,2}):(\d{2})$/);
  if (!m) throw new Error(`日時の形式が不正です: ${s}`);
  const [y, mo, d, h, mi] = m.slice(1).map(Number);
  const wd = WEEKDAYS[new Date(y, mo - 1, d).getDay()];
  return `${mo}月${d}日(${wd}) ${h}:${String(mi).padStart(2, '0')}`;
}

/** "2026-12-20" → "12月20日" */
export function formatDate(s: string): string {
  const m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!m) throw new Error(`日付の形式が不正です: ${s}`);
  return `${Number(m[2])}月${Number(m[3])}日`;
}

/** 通し番号を 3 桁ゼロ埋めにする */
export const formatNo = (n: number) => String(n).padStart(3, '0');
