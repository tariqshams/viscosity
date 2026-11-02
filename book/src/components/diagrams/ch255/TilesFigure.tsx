// The tiles the chapter's instruction selector knows: each tree pattern on
// the left becomes the RISC-V instructions on the right (d is a fresh
// virtual register; "no" is the label to jump to when a test fails).
// Matches the select() function in the chapter's code.
import { Box, Svg, T, tok } from '../../viz/svg';

const ROWS: [string, string[], string][] = [
  ['k', ['li   d, k'], 'f1'],
  ['x', ['(x\'s own register)'], 'f1'],
  ['a + k,  a - k', ['addi d, a, ±k'], 'f2'],
  ['a + b,  a - b,  a * b', ['add / sub / mul d, a, b'], 'f2'],
  ['if a < b  (test)', ['bge  a, b, no'], 'f3'],
  ['if a < 0  (test)', ['bge  a, zero, no'], 'f3'],
  ['f(a, b)', ['mv a0, a;  mv a1, b', 'call f;  mv d, a0'], 'f4'],
];

export default function TilesFigure() {
  let y = 22;
  return (
    <Svg w={400} h={312} title="Seven tree patterns and the RISC-V instructions each one becomes">
      <T x={8} y={10} size={11} weight={700} fill={tok('muted')}>TREE PATTERN</T>
      <T x={170} y={10} size={11} weight={700} fill={tok('muted')}>INSTRUCTIONS</T>
      {ROWS.map(([pat, ins, c], k) => {
        const h = 14 + ins.length * 16;
        const top = y;
        y += h + 8;
        return (
          <g key={k}>
            <Box x={4} y={top} w={156} h={h} fill={tok(c, 0.16)} stroke={tok(c)}>
              <T x={12} y={top + h / 2} size={11.5} mono>{pat}</T>
            </Box>
            <Box x={166} y={top} w={230} h={h} fill={tok('paper')} stroke={tok('line')}>
              {ins.map((l, j) => <T key={j} x={174} y={top + 15 + j * 16} size={11.5} mono>{l}</T>)}
            </Box>
          </g>
        );
      })}
    </Svg>
  );
}
