import type { CSSProperties } from 'react';
import { formatDate, formatDateTime, formatNo } from '../domain/format';
import type { ThemeTokens } from '../domain/theme';
import './Card.css';

/** 全カード共通の情報 */
export type EventInfo = {
  school: string;
  title: string;
  year: number;
  startsAt: string; // "2027-01-11 18:00"
  venue: string;
  fee?: string;
  deadline?: string; // "2026-12-20"
  message?: string;
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
};

/** 文字列の見かけの幅（em 換算。半角スペースは狭く数える） */
const units = (s: string) => [...s].reduce((sum, ch) => sum + (/[ 　]/.test(ch) ? 0.4 : 1), 0);
/** maxWidth(px) に収まる font-size を上限 max・下限 min の範囲で返す */
const fitSize = (s: string, maxWidth: number, max: number, min: number) =>
  Math.max(min, Math.min(max, Math.floor(maxWidth / units(s))));

/** 固定デザインの招待カード。props は共通情報・1人分・導出済みテーマだけ */
export function Card({ event, person, tokens }: CardProps) {
  const recipient = `${person.name} 様`;
  return (
    <div className="card" style={tokens as CSSProperties}>
      <div className="card__header">
        <span>INVITATION</span>
        <span>{event.year}</span>
      </div>

      <div className="card__strip">
        <div
          className="card__title"
          style={{ fontSize: fitSize(event.title, 340, 44, 24) }}
        >
          {event.title}
        </div>
      </div>

      <div className="card__who">
        <div className="card__school">
          {event.school}　{person.className}
        </div>
        <div
          className="card__recipient"
          style={{ fontSize: fitSize(recipient, 430, 54, 30) }}
        >
          {recipient}
        </div>
      </div>

      <div className="card__perf" />

      <dl className="card__info">
        <div className="card__field">
          <dt>日時</dt>
          <dd>{formatDateTime(event.startsAt)}</dd>
        </div>
        <div className="card__field">
          <dt>会場</dt>
          <dd>{event.venue}</dd>
        </div>
        {event.fee && (
          <div className="card__field">
            <dt>会費</dt>
            <dd>{event.fee}</dd>
          </div>
        )}
        {event.deadline && (
          <div className="card__field">
            <dt>返信期限</dt>
            <dd>{formatDate(event.deadline)}</dd>
          </div>
        )}
      </dl>

      {event.message && <p className="card__message">{event.message}</p>}

      <div className="card__no">No. {formatNo(person.no)}</div>
    </div>
  );
}
