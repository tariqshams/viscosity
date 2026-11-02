// Chapter 316-b: drip-rs's Value enum (book/companion/rust/src/value.rs),
// byte by byte, as rustc 1.97.0's -Zprint-type-sizes reported it for a
// release build of the crate on x86-64 Linux: 16 bytes, alignment 8; a
// 1-byte discriminant at offset 0; Bool's field right after it; a 4-byte
// Gc handle after 3 bytes of padding; String's 8-byte StrRef (handle and
// hash, alignment 4) after 3 bytes of padding; Number's f64 after 7.
import { Box, Svg, T, tok } from '../../viz/svg';

type Kind = 'tag' | 'pad' | 'data' | 'free';
type Row = { name: string; cells: [Kind, number, string?][] };

const ROWS: Row[] = [
  { name: 'Number', cells: [['tag', 1], ['pad', 7], ['data', 8, 'f64']] },
  { name: 'String', cells: [['tag', 1], ['pad', 3], ['data', 4, 'handle'], ['data', 4, 'hash'], ['free', 4]] },
  { name: 'List', cells: [['tag', 1], ['pad', 3], ['data', 4, 'Gc'], ['free', 8]] },
  { name: 'Bool', cells: [['tag', 1], ['data', 1, 'b'], ['free', 14]] },
  { name: 'None', cells: [['tag', 1], ['free', 15]] },
];

export default function ValueLayout() {
  const cw = 18;
  const x0 = 64;
  const rowH = 32;
  return (
    <Svg w={400} h={ROWS.length * rowH + 56} title="Five variants of drip-rs's Value drawn as rows of 16 bytes: a tag byte, padding, and each variant's data">
      {Array.from({ length: 17 }, (_, i) => (i % 4 === 0 ? (
        <T key={i} x={x0 + i * cw} y={10} size={11} mono anchor="middle" fill={tok('muted')}>{i}</T>
      ) : null))}
      {ROWS.map((r, k) => {
        const y = 20 + k * rowH;
        let x = x0;
        return (
          <g key={r.name}>
            <T x={x0 - 6} y={y + 12} size={11} mono anchor="end" fill={tok('ink')}>{r.name}</T>
            {r.cells.map(([kind, n, label], j) => {
              const w = n * cw;
              const color = kind === 'tag' ? 'f6' : kind === 'data' ? 'f1' : 'muted';
              const el = (
                <Box key={j} x={x + 0.5} y={y} w={w - 1} h={24} r={2}
                  fill={kind === 'pad' ? tok('muted', 0.12) : kind === 'free' ? 'transparent' : tok(color, 0.28)}
                  stroke={kind === 'free' ? tok('line', 0.7) : kind === 'pad' ? tok('muted', 0.7) : tok(color)}
                  dash={kind === 'pad' || kind === 'free'}>
                  {label && <T x={x + w / 2} y={y + 12} size={11} anchor="middle" fill={tok('ink')}>{label}</T>}
                  {kind === 'tag' && <T x={x + w / 2} y={y + 12} size={11} anchor="middle" fill={tok('ink')}>t</T>}
                </Box>
              );
              x += w;
              return el;
            })}
          </g>
        );
      })}
      <g transform={`translate(0, ${ROWS.length * rowH + 30})`}>
        <Box x={8} y={0} w={14} h={12} r={2} fill={tok('f6', 0.28)} stroke={tok('f6')} />
        <T x={26} y={6} size={11} fill={tok('muted')}>tag</T>
        <Box x={64} y={0} w={14} h={12} r={2} fill={tok('muted', 0.12)} stroke={tok('muted', 0.7)} dash />
        <T x={82} y={6} size={11} fill={tok('muted')}>padding</T>
        <Box x={150} y={0} w={14} h={12} r={2} fill="transparent" stroke={tok('line', 0.7)} dash />
        <T x={168} y={6} size={11} fill={tok('muted')}>unused by this variant</T>
      </g>
    </Svg>
  );
}
