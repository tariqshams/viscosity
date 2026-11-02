import { Svg, T, tok } from '../../viz/svg';

// Chapter 386: what Cargo's default (caret) requirement accepts, from the
// Cargo book's "Specifying dependencies": the left-most non-zero part must
// stay the same. Three requirements, each drawn as the range it accepts.
const ROWS = [
  { req: '"1.2.3"', range: '>=1.2.3, <2.0.0', from: '1.2.3', ok: ['1.2.4', '1.9.0'], no: '2.0.0', span: 0.8 },
  { req: '"0.1.0"', range: '>=0.1.0, <0.2.0', from: '0.1.0', ok: ['0.1.1', '0.1.9'], no: '0.2.0', span: 0.55 },
  { req: '"0.0.1"', range: '>=0.0.1, <0.0.2', from: '0.0.1', ok: [], no: '0.0.2', span: 0.2 },
];

export default function CaretRanges() {
  const x0 = 20;
  const W = 360;
  return (
    <Svg w={400} h={250} title="Three caret requirements and the versions each one accepts: 1.2.3 accepts up to but not including 2.0.0, 0.1.0 up to 0.2.0, and 0.0.1 only itself">
      {ROWS.map((r, i) => {
        const y = 22 + i * 78;
        const end = x0 + r.span * W;
        return (
          <g key={r.req}>
            <T x={x0} y={y} size={12} mono weight={700}>{r.req}</T>
            <T x={x0 + 70} y={y} size={11} mono fill={tok('muted')}>{`means ${r.range}`}</T>
            <line x1={x0} x2={x0 + W} y1={y + 28} y2={y + 28} stroke={tok('line')} strokeWidth={2} />
            <rect x={x0} y={y + 20} width={end - x0} height={16} rx={3} fill={tok('safe', 0.25)} stroke={tok('safe')} />
            <circle cx={x0 + 4} cy={y + 28} r={4} fill={tok('safe')} />
            <T x={x0} y={y + 50} size={11} mono>{r.from}</T>
            {r.ok.map((v, k) => (
              <T key={v} x={x0 + (k + 1) * (r.span * W) / 3} y={y + 50} size={11} mono anchor="middle" fill={tok('safe')}>{v}</T>
            ))}
            <line x1={end} x2={end} y1={y + 16} y2={y + 40} stroke={tok('danger')} strokeWidth={2} />
            <T x={end + 4} y={y + 50} size={11} mono fill={tok('danger')}>{`${r.no} ✗`}</T>
          </g>
        );
      })}
      <T x={x0} y={244} size={11} fill={tok('muted')}>For 0.0.z, every new release falls outside the range.</T>
    </Svg>
  );
}
