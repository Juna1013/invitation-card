/** "2027-01-10" → "2027.01.10" */
export function formatDateDotted(s: string): string {
  const m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!m) throw new Error(`日付の形式が不正です（YYYY-MM-DD）: ${s}`);
  const [y, mo, d] = m.slice(1).map(Number);
  // 存在しない日付（2027-02-30 など）を弾く
  const dt = new Date(y, mo - 1, d);
  if (dt.getMonth() !== mo - 1 || dt.getDate() !== d) throw new Error(`存在しない日付です: ${s}`);
  return `${y}.${String(mo).padStart(2, '0')}.${String(d).padStart(2, '0')}`;
}

/** "9:00" → "09:00"（24 時間表記。時刻として不正なら例外） */
export function formatTime(s: string): string {
  const m = s.match(/^(\d{1,2}):(\d{2})$/);
  if (!m || Number(m[1]) > 23 || Number(m[2]) > 59) throw new Error(`時刻の形式が不正です（HH:MM）: ${s}`);
  return `${m[1].padStart(2, '0')}:${m[2]}`;
}

/** 通し番号を 3 桁ゼロ埋めにする */
export const formatNo = (n: number) => String(n).padStart(3, '0');
