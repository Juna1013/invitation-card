/*
 * 霞（かすみ）の雲。線の形（path データ）は次のリポジトリのものを取り込んだ。
 *   https://github.com/shikosai34/shikosai34-web （src/lib/kasumi.ts, src/components/ui/KasumiCloud.tsx）
 *   ライセンス表記なし。利用は出典側の了承を前提とする（src/assets/wagasa/README.md も参照）
 *
 * 1本の連続線（水平線＋半円）に、各段の内側の半円を重ねた形。viewBox は 0 0 210 226。
 * 線を1本の path にまとめるのは、半透明で描いたとき重なりが濃くならないようにするため。
 */

/** 本体。水平線＋半円を上から順につないだ連続線。 */
const KASUMI_MAIN =
  'M 215 61 H 121 A 9 9 0 0 0 121 79 H 188 A 11.5 11.5 0 0 1 188 102 ' +
  'H 45.5 A 9 9 0 0 0 45.5 120 H 127 A 12 12 0 0 1 127 144 ' +
  'H 57.5 A 9 9 0 0 0 57.5 162 H 152 A 11.5 11.5 0 0 1 152 185 H 10';

/** 最上段の直線。 */
const KASUMI_TOP = 'M 89.5 37.5 H 215';

/** 各段の内側に重ねる半円。 */
const KASUMI_INNER = [
  'M 149 61 A 9 9 0 0 0 149 79',
  'M 159 79 A 11.5 11.5 0 0 1 159 102',
  'M 74 102 A 9 9 0 0 0 74 120',
  'M 98 120 A 12 12 0 0 1 98 144',
  'M 86 144 A 9 9 0 0 0 86 162',
  'M 123.5 162 A 11.5 11.5 0 0 1 123.5 185',
];

const KASUMI_PATH = [KASUMI_TOP, KASUMI_MAIN, ...KASUMI_INNER].join(' ');

/** 色は currentColor。flip で左右反転（線が出ていく側が逆になる）。id は同じページ内で重複させない */
export function Kasumi({ id, flip = false, className }: { id: string; flip?: boolean; className?: string }) {
  const filterId = `${id}-glow`;
  const shapeId = `${id}-shape`;
  return (
    <svg
      viewBox="0 0 210 226"
      overflow="visible"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <defs>
        <filter id={filterId} filterUnits="userSpaceOnUse" x="-45" y="-10" width="300" height="246">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="near" />
          <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="far" />
          <feMerge>
            <feMergeNode in="far" />
            <feMergeNode in="near" />
          </feMerge>
        </filter>
        <g id={shapeId} transform={flip ? 'translate(210 0) scale(-1 1)' : undefined}>
          <path d={KASUMI_PATH} />
        </g>
      </defs>
      {/* 発光層（太い線をぼかす）と、ぼかさない芯 */}
      <use href={`#${shapeId}`} strokeWidth="6" strokeOpacity="0.55" filter={`url(#${filterId})`} />
      <use href={`#${shapeId}`} strokeWidth="3" />
    </svg>
  );
}
