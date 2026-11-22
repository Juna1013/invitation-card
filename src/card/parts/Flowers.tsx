/*
 * 霞に添える花（線画）。梅・桜・菊の3種を、半径 r から幾何学的に描く自作の図形。
 * 花の下に地色（--card-bg）の円を敷き、霞や和傘の線が花の中に透けないようにする。
 * 色は CSS（.flower__line）で指定する。座標はカード（500x740 px）と1対1。
 */

type Kind = 'ume' | 'sakura' | 'kiku';
type FlowerSpec = { kind: Kind; x: number; y: number; r: number; rot?: number };

const f = (n: number) => n.toFixed(2);
const rad = (d: number) => (d * Math.PI) / 180;
const ring = (n: number) => Array.from({ length: n }, (_, i) => i);

/** 梅：丸い花びら5枚 */
function Ume({ r }: { r: number }) {
  return (
    <>
      {ring(5).map((i) => {
        const a = rad(i * 72 - 90);
        return <circle key={i} cx={f(Math.cos(a) * r * 0.55)} cy={f(Math.sin(a) * r * 0.55)} r={f(r * 0.46)} />;
      })}
      <circle r={f(r * 0.17)} />
      {ring(5).map((i) => {
        const a = rad(i * 72 - 54);
        return <circle key={`s${i}`} cx={f(Math.cos(a) * r * 0.36)} cy={f(Math.sin(a) * r * 0.36)} r={f(r * 0.04)} />;
      })}
    </>
  );
}

/** 桜：先端に切れ込みのある花びら5枚＋中心から出るおしべ */
function Sakura({ r }: { r: number }) {
  const petal =
    `M0 0 C${f(-0.5 * r)} ${f(-0.25 * r)} ${f(-0.56 * r)} ${f(-0.86 * r)} ${f(-0.2 * r)} ${f(-r)} ` +
    `L0 ${f(-0.82 * r)} L${f(0.2 * r)} ${f(-r)} C${f(0.56 * r)} ${f(-0.86 * r)} ${f(0.5 * r)} ${f(-0.25 * r)} 0 0Z`;
  return (
    <>
      {ring(5).map((i) => (
        <path key={i} d={petal} transform={`rotate(${i * 72})`} />
      ))}
      {ring(10).map((i) => {
        const a = rad(i * 36);
        return <line key={`l${i}`} x1="0" y1="0" x2={f(Math.cos(a) * r * 0.28)} y2={f(Math.sin(a) * r * 0.28)} />;
      })}
    </>
  );
}

/** 菊：細長い花びらを2重に並べた花 */
function Kiku({ r }: { r: number }) {
  return (
    <>
      {ring(16).map((i) => (
        <ellipse
          key={i}
          cx="0"
          cy={f(-r * 0.68)}
          rx={f(r * 0.1)}
          ry={f(r * 0.3)}
          transform={`rotate(${i * 22.5})`}
        />
      ))}
      {ring(8).map((i) => (
        <ellipse
          key={`b${i}`}
          cx="0"
          cy={f(-r * 0.4)}
          rx={f(r * 0.09)}
          ry={f(r * 0.17)}
          transform={`rotate(${i * 45 + 22.5})`}
        />
      ))}
      <circle r={f(r * 0.14)} />
    </>
  );
}

function Flower({ kind, x, y, r, rot = 0 }: FlowerSpec) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <circle className="flower__base" r={f(r * 1.02)} />
      <g className="flower__line">
        {kind === 'ume' && <Ume r={r} />}
        {kind === 'sakura' && <Sakura r={r} />}
        {kind === 'kiku' && <Kiku r={r} />}
      </g>
    </g>
  );
}

/** カードに置く花。右上の霞（x≥340, y 96〜270）と左下の霞（x≤150, y 380〜550）に寄せる */
const FLOWERS: FlowerSpec[] = [
  // 右の霞
  { kind: 'kiku', x: 468, y: 236, r: 27 },
  { kind: 'ume', x: 418, y: 258, r: 21, rot: 12 },
  { kind: 'sakura', x: 487, y: 176, r: 18, rot: 20 },
  { kind: 'ume', x: 440, y: 202, r: 11 },
  { kind: 'sakura', x: 386, y: 224, r: 13, rot: -10 },
  // 左の霞
  { kind: 'ume', x: 34, y: 468, r: 28, rot: 8 },
  { kind: 'sakura', x: 92, y: 440, r: 19, rot: 30 },
  { kind: 'kiku', x: 16, y: 404, r: 16 },
  { kind: 'ume', x: 112, y: 500, r: 11 },
  { kind: 'sakura', x: 64, y: 524, r: 14, rot: -18 },
];

export function Flowers() {
  return (
    <svg className="card__flowers" viewBox="0 0 500 740" aria-hidden="true">
      {FLOWERS.map((fl, i) => (
        <Flower key={i} {...fl} />
      ))}
    </svg>
  );
}
