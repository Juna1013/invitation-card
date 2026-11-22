import type { CSSProperties } from 'react';
import { formatDateTime, formatNo } from '../domain/format';
import type { ThemeTokens } from '../domain/theme';
import asanohaUrl from '../assets/wagasa/wagasa-asanoha.svg';
import seigaihaUrl from '../assets/wagasa/wagasa-seigaiha.svg';
import uzuUrl from '../assets/wagasa/wagasa-uzu.svg';
import { Kasumi } from './parts/Kasumi';
import './Card.css';

/** 全カード共通の情報 */
export type EventInfo = {
  school: string;
  title: string;
  year: number;
  startsAt: string; // "2027-01-11 18:00"
  fee?: string;
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

/** SVG の線の形だけを取り出し、文字色（--ink）で塗る（元の SVG の線の色に依存しない） */
const maskOf = (url: string): CSSProperties => ({ WebkitMaskImage: `url(${url})`, maskImage: `url(${url})` });

/** 宛名の標準の文字サイズ（px）。全カード同じ。収まらない長い名前のときだけ縮小する */
const RECIPIENT_SIZE = 18;

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
 * props は共通情報・1人分・導出済みテーマだけ。色は CSS 変数でのみ受け取る。
 */
export function Card({ event, person, tokens }: CardProps) {
  const recipient = `${person.name} 様`;
  return (
    <div className="sheet" style={tokens as CSSProperties}>
      <div className="card">
        <div className="card__art" aria-hidden>
          <div className="card__wagasa card__wagasa--tl" style={maskOf(asanohaUrl)} />
          <div className="card__wagasa card__wagasa--c" style={maskOf(uzuUrl)} />
          <div className="card__wagasa card__wagasa--br" style={maskOf(seigaihaUrl)} />
          <Kasumi id="kasumi-r" className="card__kasumi card__kasumi--r" />
          <Kasumi id="kasumi-l" flip className="card__kasumi card__kasumi--l" />
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

        <footer className="card__footer">
          <Field label="宛名" value={recipient} size={fitSize(recipient, 230, RECIPIENT_SIZE, 13)} />
          <Field label="日時" value={formatDateTime(event.startsAt)} right />
          <Field label="クラス" value={person.className} />
          {event.fee && <Field label="会費" value={event.fee} right />}
        </footer>
      </div>
    </div>
  );
}
