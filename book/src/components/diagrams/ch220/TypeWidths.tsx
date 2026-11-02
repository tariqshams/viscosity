// Chapter 220: TypeScript's one number type next to Rust's scalar types,
// drawn as rows of bytes. Sizes are what std::mem::size_of reports on a
// 64-bit machine (checked with rustc 1.97 on x86-64); usize and isize
// follow the machine's pointer width.
import { Box, Svg, T, tok } from '../../viz/svg';

type Row = { name: string; bytes: number; kind: 'ts' | 'int' | 'uint' | 'float' | 'other'; what: string };

const ROWS: Row[] = [
  { name: 'number', bytes: 8, kind: 'ts', what: 'TypeScript: always float64' },
  { name: 'u8', bytes: 1, kind: 'uint', what: '0 to 255: one byte' },
  { name: 'i32', bytes: 4, kind: 'int', what: 'the default integer' },
  { name: 'i64', bytes: 8, kind: 'int', what: 'bigger whole numbers' },
  { name: 'usize', bytes: 8, kind: 'uint', what: 'indexes and lengths' },
  { name: 'f64', bytes: 8, kind: 'float', what: 'same as a JS number' },
  { name: 'bool', bytes: 1, kind: 'other', what: 'true or false' },
  { name: 'char', bytes: 4, kind: 'other', what: 'one Unicode scalar value' },
];

const colour = { ts: 'muted', int: 'accent', uint: 'safe', float: 'brand', other: 'warn' } as const;

export default function TypeWidths() {
  const cell = 20;
  const x0 = 62;
  const rowH = 30;
  return (
    <Svg w={400} h={ROWS.length * rowH + 30} title="Byte widths of TypeScript's number and Rust's scalar types">
      <T x={x0} y={10} size={10} fill={tok('muted')}>one square = one byte</T>
      {ROWS.map((r, i) => {
        const y = 22 + i * rowH;
        const c = colour[r.kind];
        return (
          <g key={r.name}>
            <T x={x0 - 8} y={y + cell / 2} size={13} mono weight={700} anchor="end" fill={r.kind === 'ts' ? tok('muted') : tok('ink')}>{r.name}</T>
            {Array.from({ length: r.bytes }, (_, b) => (
              <Box key={b} x={x0 + b * cell} y={y} w={cell - 3} h={cell} r={3} fill={tok(c, 0.22)} stroke={tok(c)} />
            ))}
            <T x={x0 + 8 * cell + 6} y={y + cell / 2} size={11} fill={tok('muted')}>{r.what}</T>
          </g>
        );
      })}
      <line x1={4} y1={22 + rowH - 4} x2={396} y2={22 + rowH - 4} stroke={tok('line')} strokeDasharray="4 3" />
    </Svg>
  );
}
