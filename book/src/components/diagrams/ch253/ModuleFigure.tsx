// The 39 bytes of the WebAssembly module for fn sq(x) { return x * x; },
// grouped by section. Byte values from the WebAssembly core spec's binary
// format (wg-2.0 tag: preamble, section ids 1/3/7/10, 0x60 functype,
// 0x7c f64, 0x20 local.get, 0xa2 f64.mul, 0x0b end); the module was
// checked by instantiating it in Node 22 (sq(7) = 49).
import { Box, Svg, T, tok } from '../../viz/svg';

type Row = { label: string; bytes: string[]; color: string; means: string };

const ROWS: Row[] = [
  { label: 'preamble', bytes: ['00', '61', '73', '6d', '01', '00', '00', '00'], color: 'muted', means: '"\\0asm", version 1' },
  { label: 'type (id 1)', bytes: ['01', '06', '01', '60', '01', '7c', '01', '7c'], color: 'f1', means: 'type 0: (f64) → f64' },
  { label: 'function (3)', bytes: ['03', '02', '01', '00'], color: 'f2', means: 'fn 0 has type 0' },
  { label: 'export (7)', bytes: ['07', '06', '01', '02', '73', '71', '00', '00'], color: 'f3', means: '"sq" is fn 0' },
  { label: 'code (10)', bytes: ['0a', '09', '01', '07', '00'], color: 'f4', means: '1 body, 7 bytes' },
  { label: '', bytes: ['20', '00', '20', '00', 'a2', '0b'], color: 'f5', means: 'x, x, f64.mul, end' },
];

export default function ModuleFigure() {
  return (
    <Svg w={400} h={262} title="The bytes of a WebAssembly module for sq, one row per section: preamble, type, function, export and code">
      {ROWS.map((r, k) => {
        const y = 4 + k * 43;
        return (
          <g key={k}>
            {r.label && <T x={8} y={y + 12} size={11} weight={700} fill={tok('muted')}>{r.label.toUpperCase()}</T>}
            {r.bytes.map((b, j) => (
              <Box key={j} x={8 + j * 30} y={y + 20} w={27} h={20} r={3} fill={tok(r.color, 0.18)} stroke={tok(r.color)}>
                <T x={21.5 + j * 30} y={y + 30} size={11} mono anchor="middle">{b}</T>
              </Box>
            ))}
            <T x={254} y={y + 30} size={11} fill={tok('ink')}>{r.means}</T>
          </g>
        );
      })}
    </Svg>
  );
}
