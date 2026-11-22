import { formatNo } from './format';

/**
 * QR コードに入れる文字列。
 * 出欠フォームの URL があれば、通し番号をクエリに付ける（氏名は入れない）。
 * 無ければ受付照合用に通し番号だけを入れる。
 */
export function qrText(rsvpUrl: string | undefined, no: number): string {
  const n = formatNo(no);
  if (!rsvpUrl) return `NO-${n}`;
  return `${rsvpUrl}${rsvpUrl.includes('?') ? '&' : '?'}no=${n}`;
}
