// Chapter 80: when each local of a nested block is alive, drawn against
// the stack slot it lives in. b and c never overlap, so c reuses b's slot.
// The slots match the real disassembly: a is slot 1, b and c are slot 2.
import { Box, Svg, T, tok } from '../../viz/svg';

const LINES = ['{', '  let a = 1;', '  {', '    let b = 2;', '  }', '  let c = 3;', '}'];

/** [name, slot, first line alive, last line alive] (1-based lines). */
const LIVES: [string, number, number, number][] = [
  ['a', 1, 2, 7],
  ['b', 2, 4, 5],
  ['c', 2, 6, 7],
];

const X0 = 128;
const COL = 38;
const colX = (line: number) => X0 + (line - 1) * COL;
const rowY = (slot: number) => 128 - slot * 36;

export default function LifetimeFigure() {
  return (
    <Svg w={400} h={210} title="Lifetimes of three locals against their stack slots. a lives in slot 1 from line 2 to line 7. b lives in slot 2 on lines 4 and 5; c lives in slot 2 on lines 6 and 7, reusing b's slot after b has gone.">
      <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>SLOT</T>
      <T x={X0} y={12} size={11} weight={700} fill={tok('muted')}>SOURCE LINE (time runs right)</T>
      {[0, 1, 2].map((s) => (
        <g key={s}>
          <T x={40} y={rowY(s) + 13} size={12} mono anchor="middle" fill={tok('muted')}>{s}</T>
          <line x1={X0 - 6} x2={colX(7) + COL - 6} y1={rowY(s) + 26} y2={rowY(s) + 26} stroke={tok('line')} />
        </g>
      ))}
      <Box x={X0} y={rowY(0)} w={colX(7) + COL - 8 - X0} h={24} fill={tok('muted', 0.12)} stroke={tok('line')}>
        <T x={X0 + 8} y={rowY(0) + 12} size={11} mono fill={tok('muted')}>the running script</T>
      </Box>
      {LIVES.map(([name, slot, from, to]) => {
        const x = colX(from);
        const w = colX(to) + COL - 8 - x;
        return (
          <Box key={name} x={x} y={rowY(slot)} w={w} h={24} fill={tok('brand', 0.14)} stroke={tok('brand')}>
            <T x={x + w / 2} y={rowY(slot) + 12} size={13} mono weight={700} anchor="middle">{name}</T>
          </Box>
        );
      })}
      {LINES.map((_, i) => (
        <T key={i} x={colX(i + 1) + COL / 2 - 4} y={164} size={11} mono anchor="middle" fill={tok('muted')}>{i + 1}</T>
      ))}
      <T x={8} y={186} size={11.5} fill={tok('ink')}>Each local is born at its let and dies at the</T>
      <T x={8} y={202} size={11.5} fill={tok('ink')}>closing brace of its block: last in, first out.</T>
    </Svg>
  );
}
