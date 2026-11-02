// Chapter 365: what is inside some common Rust values, 11 units per
// byte. Sizes are what size_of printed with rustc 1.97.0 on x86-64 Linux
// (u32 4, f64 8, &f64 8, &[f64] 16, Vec<f64> 24, Option<f64> 16,
// Option<&f64> 8). -Zprint-type-sizes reported Option<f64>'s tag as
// 8 bytes wide: rustc widened it into what would have been padding. The split of Vec into pointer, capacity and length
// is the standard library's; the order of those words is not promised.
import { Box, Svg, T, tok } from '../../viz/svg';

type Part = { label: string; bytes: number; color: string; dim?: boolean };

type Row = { ty: string; parts: Part[] };

const ROWS: Row[] = [
  { ty: 'u32', parts: [{ label: 'number', bytes: 4, color: 'f1' }] },
  { ty: 'f64', parts: [{ label: 'number', bytes: 8, color: 'f1' }] },
  { ty: '&f64', parts: [{ label: 'address', bytes: 8, color: 'f3' }] },
  { ty: '&[f64]', parts: [{ label: 'address', bytes: 8, color: 'f3' }, { label: 'length', bytes: 8, color: 'f4' }] },
  { ty: 'Vec<f64>', parts: [{ label: 'address', bytes: 8, color: 'f3' }, { label: 'capacity', bytes: 8, color: 'f5' }, { label: 'length', bytes: 8, color: 'f4' }] },
  { ty: 'Option<&f64>', parts: [{ label: 'addr, 0 = None', bytes: 8, color: 'f3' }] },
  { ty: 'Option<f64>', parts: [{ label: 'tag', bytes: 8, color: 'f6' }, { label: 'number', bytes: 8, color: 'f1' }] },
];

export default function SizeBars() {
  const unit = 11; // px per byte
  const x0 = 104;
  const rowH = 30;
  return (
    <Svg w={400} h={ROWS.length * rowH + 30} title="Bars showing how many bytes each type takes and what the bytes hold">
      {ROWS.map((r, k) => {
        const y = 8 + k * rowH;
        let x = x0;
        const total = r.parts.reduce((n, p) => n + p.bytes, 0);
        return (
          <g key={r.ty}>
            <T x={96} y={y + 11} size={12} mono anchor="end" fill={tok('ink')}>{r.ty}</T>
            {r.parts.map((p, j) => {
              const w = p.bytes * unit;
              const el = (
                <Box key={j} x={x} y={y} w={w - 1} h={22} r={2} fill={tok(p.color, p.dim ? 0.08 : 0.25)} stroke={p.dim ? tok('muted', 0.6) : tok(p.color)} dash={p.dim}>
                  <T x={x + w / 2} y={y + 11} size={11} anchor="middle" fill={p.dim ? tok('muted') : tok('ink')}>{p.label}</T>
                </Box>
              );
              x += w;
              return el;
            })}
            <T x={x + 4} y={y + 11} size={11} mono fill={tok('muted')}>{total}</T>
          </g>
        );
      })}
      <T x={x0} y={ROWS.length * rowH + 20} size={11} fill={tok('muted')}>one tick of width = 1 byte; numbers on the right are size_of</T>
    </Svg>
  );
}
