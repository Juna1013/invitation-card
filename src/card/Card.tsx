import type { CSSProperties } from 'react';
import { formatDateTime, formatNo } from '../domain/format';
import type { ThemeTokens } from '../domain/theme';
import { Qr } from './parts/Qr';
import './Card.css';

/** 全カード共通の情報 */
export type EventInfo = {
  school: string;
  title: string;
  year: number;
  startsAt: string; // "2027-01-11 18:00"
  fee?: string;
  rsvpUrl?: string; // 出欠フォーム（QR に使う）
};

/** 1人分の情報 */
export type Person = {
  name: string;
  className: string;
  no: number;
};

export type CardProps = {
  event: EventInfo;
  person: Person;
  tokens: ThemeTokens;
  qrText: string;
};

/** 文字列の見かけの幅（em 換算。スペースは狭く数える） */
const units = (s: string) => [...s].reduce((sum, ch) => sum + (/[ 　]/.test(ch) ? 0.4 : 1), 0);
/** maxWidth(px) に収まる font-size を上限 max・下限 min の範囲で返す */
const fitSize = (s: string, maxWidth: number, max: number, min: number) =>
  Math.max(min, Math.min(max, Math.floor(maxWidth / units(s))));

function Field({ label, value, right, size }: { label: string; value: string; right?: boolean; size?: number }) {
  return (
    <div className={right ? 'field field--right' : 'field'}>
      <div className="field__label">{label}</div>
      <div className="field__value" style={size ? { fontSize: size } : undefined}>
        {value}
      </div>
    </div>
  );
}

/**
 * 固定デザインの招待パス（Wallet 風）。
 * props は共通情報・1人分・導出済みテーマ・QR文字列だけ。色は CSS 変数でのみ受け取る。
 */
export function Card({ event, person, tokens, qrText }: CardProps) {
  const recipient = `${person.name} 様`;
  return (
    <div className="sheet" style={tokens as CSSProperties}>
      <div className="card">
        <div className="card__art" aria-hidden>
          <div className="card__rays" />
          <div className="card__sun" />
          <div className="card__shade" />
        </div>

        <header className="card__header">
          <div>
            <div className="card__title" style={{ fontSize: fitSize(event.title, 290, 24, 15) }}>
              {event.title}
            </div>
            <div className="card__school">
              {event.year}　{event.school}
            </div>
          </div>
          <div className="card__guest">
            <div className="label">GUEST NO.</div>
            <div className="card__guest-no">{formatNo(person.no)}</div>
          </div>
        </header>

        <div className="card__qr">
          <Qr text={qrText} />
        </div>

        <div className="card__info">
          <Field label="宛名" value={recipient} size={fitSize(recipient, 230, 19, 13)} />
          <Field label="日時" value={formatDateTime(event.startsAt)} right />
          <Field label="クラス" value={person.className} />
          {event.fee && <Field label="会費" value={event.fee} right />}
        </div>
      </div>
    </div>
  );
}
