/*
 * 霞に添える花（線画）。梅・桜・輪花の3種を、半径 r から幾何学的に描く自作の図形。
 *   梅  : 丸い花びら5枚（二重線）＋おしべの輪
 *   桜  : 先端に切れ込みのある花びら5枚（花びらごとに筋）＋おしべ
 *   輪花: 二重の円の間に細い放射線を並べた、丸い花
 * 花は後から描いたものが手前になる。各花の下に地色（--card-bg）の円を敷き、
 * 霞・和傘・手前の花の線が透けないようにする（花どうしを重ねて房のように見せる）。
 * 色は CSS（.flower__line）で指定する。座標はカード（500x740 px）と1対1。
 */

type Kind = 'ume' | 'sakura' | 'rin';
type FlowerSpec = { kind: Kind; x: number; y: number; r: number; rot?: number };

const f = (n: number) => n.toFixed(2);
const rad = (d: number) => (d * Math.PI) / 180;
const ring = (n: number) => Array.from({ length: n }, (_, i) => i);
const polar = (r: number, deg: number) => [Math.cos(rad(deg)) * r, Math.sin(rad(deg)) * r] as const;

/** 梅：丸い花びら5枚（外形と内側の二重線）。中心の円と、そのまわりのおしべの点 */
function Ume({ r }: { r: number }) {
  return (
    <>
      {ring(5).map((i) => {
        const [x, y] = polar(r * 0.56, i * 72 - 90);
        const [ix, iy] = polar(r * 0.62, i * 72 - 90);
        return (
          <g key={i}>
            <circle cx={f(x)} cy={f(y)} r={f(r * 0.47)} />
            <circle cx={f(ix)} cy={f(iy)} r={f(r * 0.29)} />
          </g>
        );
      })}
      <circle r={f(r * 0.2)} />
      {ring(10).map((i) => {
        const [x, y] = polar(r * 0.31, i * 36);
        return <circle key={`s${i}`} cx={f(x)} cy={f(y)} r={f(r * 0.03)} />;
      })}
    </>
  );
}

/** 桜：先端に切れ込みのある花びら5枚。花びらごとに中心から筋を引き、中心からおしべを放つ */
function Sakura({ r }: { r: number }) {
  const petal =
    `M0 0 C${f(-0.52 * r)} ${f(-0.25 * r)} ${f(-0.58 * r)} ${f(-0.88 * r)} ${f(-0.2 * r)} ${f(-r)} ` +
    `L0 ${f(-0.82 * r)} L${f(0.2 * r)} ${f(-r)} C${f(0.58 * r)} ${f(-0.88 * r)} ${f(0.52 * r)} ${f(-0.25 * r)} 0 0Z`;
  return (
    <>
      {ring(5).map((i) => (
        <g key={i} transform={`rotate(${i * 72})`}>
          <path d={petal} />
          <path d={`M0 ${f(-0.18 * r)} L0 ${f(-0.62 * r)}`} />
        </g>
      ))}
      {ring(10).map((i) => {
        const [x, y] = polar(r * 0.3, i * 36 + 18);
        return <circle key={`s${i}`} cx={f(x)} cy={f(y)} r={f(r * 0.035)} />;
      })}
    </>
  );
}

/** 輪花：外周の小さな丸（縁取り）＋二重の円の間の放射線＋中心のおしべの輪 */
function Rin({ r }: { r: number }) {
  return (
    <>
      {ring(14).map((i) => {
        const [x, y] = polar(r * 0.88, i * (360 / 14));
        return <circle key={`e${i}`} cx={f(x)} cy={f(y)} r={f(r * 0.13)} />;
      })}
      <circle r={f(r * 0.74)} />
      <circle r={f(r * 0.34)} />
      {ring(30).map((i) => {
        const [x1, y1] = polar(r * 0.38, i * 12);
        const [x2, y2] = polar(r * 0.7, i * 12);
        return <line key={`l${i}`} x1={f(x1)} y1={f(y1)} x2={f(x2)} y2={f(y2)} />;
      })}
      {ring(8).map((i) => {
        const [x, y] = polar(r * 0.2, i * 45 + 22);
        return <circle key={`d${i}`} cx={f(x)} cy={f(y)} r={f(r * 0.03)} />;
      })}
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
        {kind === 'rin' && <Rin r={r} />}
      </g>
    </g>
  );
}

/**
 * カードに置く花。右上の霞（x≥340, y 96〜270）と左下の霞（x≤134, y 380〜550）の下の段に寄せ、
 * 大きい花を先に、小さい花を後（手前）に重ねる。
 */
const FLOWERS: FlowerSpec[] = [
  // 右の霞：雲の上の段を見せ、下の段に花を重ねる
  { kind: 'ume', x: 412, y: 252, r: 32, rot: 8 },
  { kind: 'rin', x: 466, y: 260, r: 25 },
  { kind: 'sakura', x: 450, y: 212, r: 19, rot: 20 },
  { kind: 'sakura', x: 376, y: 222, r: 15, rot: -12 },
  { kind: 'ume', x: 490, y: 222, r: 11, rot: 30 },
  { kind: 'ume', x: 438, y: 292, r: 10 },
  // 左の霞：雲の上の段を見せ、右下の端に花を重ねる
  { kind: 'ume', x: 98, y: 508, r: 32, rot: 14 },
  { kind: 'rin', x: 46, y: 536, r: 24 },
  { kind: 'sakura', x: 142, y: 468, r: 18, rot: 28 },
  { kind: 'sakura', x: 24, y: 480, r: 14, rot: -16 },
  { kind: 'ume', x: 134, y: 548, r: 10, rot: 20 },
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
