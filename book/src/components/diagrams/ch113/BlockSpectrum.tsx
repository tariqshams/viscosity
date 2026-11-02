import { Svg, T, tok } from '../../viz/svg';

// The same eight two-field elements (x, y) laid out in one Float64Array with
// three block sizes. B = 1 is packed AoS, B = 8 (the whole array) is SoA, and
// AoSoA's B = 4 sits between them. Field colours: x = f1, y = f2.
const N = 8;
const ROWS: { b: number; label: string; sub: string }[] = [
  { b: 1, label: 'B = 1', sub: 'packed AoS: one element per block' },
  { b: 4, label: 'B = 4', sub: 'AoSoA: blocks of 4 elements' },
  { b: 8, label: 'B = 8', sub: 'SoA: one block holds all 8' },
];
const CW = 23;
const X0 = 16;

function cells(b: number) {
  const out: { f: number; i: number }[] = [];
  for (let blk = 0; blk < N / b; blk++)
    for (let f = 0; f < 2; f++)
      for (let l = 0; l < b; l++) out.push({ f, i: blk * b + l });
  return out;
}

export default function BlockSpectrum() {
  return (
    <Svg w={400} h={236} title="Eight elements with fields x and y stored with block sizes 1, 4 and 8: packed AoS, AoSoA and SoA">
      {ROWS.map((r, k) => {
        const y = 14 + k * 74;
        return (
          <g key={r.b}>
            <T x={X0} y={y} size={13} weight={700}>{r.label}</T>
            <T x={X0 + 52} y={y} size={11} fill={tok('muted')}>{r.sub}</T>
            {cells(r.b).map((c, j) => {
              const x = X0 + j * CW;
              const blockStart = j % (2 * r.b) === 0;
              return (
                <g key={j}>
                  {blockStart && j > 0 && <line x1={x - 0.5} x2={x - 0.5} y1={y + 10} y2={y + 46} stroke={tok('ink')} strokeWidth={2} />}
                  <rect x={x + 1} y={y + 14} width={CW - 2} height={28} rx={3} fill={tok(c.f === 0 ? 'f1' : 'f2', 0.35)} stroke={tok(c.f === 0 ? 'f1' : 'f2')} />
                  <T x={x + CW / 2} y={y + 28} size={11} mono anchor="middle">{`${c.f === 0 ? 'x' : 'y'}${c.i}`}</T>
                </g>
              );
            })}
            <T x={X0} y={y + 56} size={11} mono fill={tok('muted')}>
              {r.b === 1 ? 'x of element i: slot 2i' : r.b === 4 ? 'x of element i: (i >> 2) * 8 + (i & 3)' : 'x of element i: slot i'}
            </T>
          </g>
        );
      })}
    </Svg>
  );
}
