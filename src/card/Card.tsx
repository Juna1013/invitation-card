import type { CSSProperties } from 'react';
import { formatDateDotted, formatNo, formatTime } from '../domain/format';
import type { ThemeTokens } from '../domain/theme';
import asanohaUrl from '../assets/wagasa/wagasa-asanoha.svg';
import seigaihaUrl from '../assets/wagasa/wagasa-seigaiha.svg';
import uzuUrl from '../assets/wagasa/wagasa-uzu.svg';
import ornamentUrl from '../assets/ornament/cloud-flowers.svg';
import './Card.css';

/** 全カード共通の情報 */
export type EventInfo = {
  title: string;
  subtitle: string;
  date: string; // "2027-01-10"
  startTime: string; // "17:00"
  endTime: string; // "19:00"
  venue: string; // 会場名
  mapUrl?: string; // 会場の地図リンク（PDF ではクリックできる。PNG では見た目が変わらない）
};

/** カードに表示する項目名と敬称 */
export type CardLabels = {
  guestNo: string;
  recipient: string;
  datetime: string;
  className: string;
  venue: string;
  honorific: string;
};

/** 1人分の情報 */
export type Person = {
  name: string;
  className: string;
  no: number;
};

export type CardProps = {
  event: EventInfo;
  labels: CardLabels;
  person: Person;
  tokens: ThemeTokens;
  /** 場所欄にリンクだと分かる印（下線と地図ピン）を付ける。クリックできる PDF 用（PNG では付けない） */
  linkHint?: boolean;
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

/** 地図ピン（文字色と同じ色の線画） */
const PinIcon = () => (
  <svg className="field__pin" viewBox="0 0 16 16" width="14" height="14" aria-hidden>
    <path d="M8 14.5s4.5-4.2 4.5-8A4.5 4.5 0 0 0 3.5 6.5c0 3.8 4.5 8 4.5 8z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    <circle cx="8" cy="6.5" r="1.6" fill="none" stroke="currentColor" strokeWidth="1.4" />
  </svg>
);

function Field({ label, value, size, href, hint }: { label: string; value: string; size?: number; href?: string; hint?: boolean }) {
  return (
    <div className="field">
      <div className="field__label">{label}</div>
      <div className="field__value" style={size ? { fontSize: size } : undefined}>
        {href ? (
          <a className={hint ? 'field__link field__link--hint' : 'field__link'} href={href}>
            {value}
            {hint && <PinIcon />}
          </a>
        ) : (
          value
        )}
      </div>
    </div>
  );
}

/**
 * 固定デザインの招待パス（Wallet 風）。
 * props は共通情報・文言（ラベル）・1人分・導出済みテーマだけ。色は CSS 変数でのみ受け取る。
 */
export function Card({ event, labels, person, tokens, linkHint = false }: CardProps) {
  const recipient = `${person.name} ${labels.honorific}`;
  return (
    <div className="sheet" style={tokens as CSSProperties}>
      <div className="card">
        <div className="card__art" aria-hidden>
          <div className="card__wagasa card__wagasa--tl" style={maskOf(asanohaUrl)} />
          <div className="card__wagasa card__wagasa--c" style={maskOf(uzuUrl)} />
          <div className="card__wagasa card__wagasa--br" style={maskOf(seigaihaUrl)} />
          <div className="card__ornament" style={maskOf(ornamentUrl)} />
        </div>

        <header className="card__header">
          <div>
            <div className="card__title" style={{ fontSize: fitSize(event.title, 290, 24, 15) }}>
              {event.title}
            </div>
            <div className="card__subtitle">{event.subtitle}</div>
          </div>
          <div className="card__guest">
            <div className="label">{labels.guestNo}</div>
            <div className="card__guest-no">{formatNo(person.no)}</div>
          </div>
        </header>

        <footer className="card__footer">
          <Field label={labels.recipient} value={recipient} size={fitSize(recipient, 230, RECIPIENT_SIZE, 13)} />
          <Field label={labels.datetime} value={`${formatDateDotted(event.date)} ${formatTime(event.startTime)} - ${formatTime(event.endTime)}`} />
          <Field label={labels.className} value={person.className} />
          <Field label={labels.venue} value={event.venue} size={fitSize(event.venue, linkHint && event.mapUrl ? 206 : 230, 17, 12)} href={event.mapUrl} hint={linkHint} />
        </footer>
      </div>
    </div>
  );
}
