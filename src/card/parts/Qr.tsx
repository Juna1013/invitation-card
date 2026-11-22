import QRCode from 'qrcode';

/** QR コードを SVG で描画する（クライアント側で生成、外部通信なし） */
export function Qr({ text }: { text: string }) {
  const { modules } = QRCode.create(text, { errorCorrectionLevel: 'M' });
  const n = modules.size;
  const quiet = 1;
  let d = '';
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++) if (modules.get(r, c)) d += `M${c + quiet} ${r + quiet}h1v1h-1z`;
  const size = n + quiet * 2;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} shapeRendering="crispEdges" role="img" aria-label="QR code">
      <path d={d} fill="#111" />
    </svg>
  );
}
