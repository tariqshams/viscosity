import { Box, Svg, T, tok } from '../../viz/svg';

// The same program, run three times, printed its HashMap in three orders
// (rustc 1.97, this book's machine). A JavaScript Map always iterates in
// insertion order.

const RUNS = [
  ['y: 1', 'x: 3', 'vx: 1'],
  ['x: 3', 'y: 1', 'vx: 1'],
  ['x: 3', 'vx: 1', 'y: 1'],
];

export default function OrderRuns() {
  return (
    <Svg w={400} h={210} title="Three runs of one Rust program printing a HashMap in three different orders, and a JavaScript Map in insertion order">
      <T x={6} y={12} size={11} weight={700} fill={tok('muted')}>RUST HashMap, SAME PROGRAM, THREE RUNS</T>
      {RUNS.map((run, i) => (
        <g key={i}>
          <T x={6} y={38 + i * 38} size={11} fill={tok('muted')}>run {i + 1}</T>
          {run.map((e, j) => (
            <Box key={j} x={60 + j * 84} y={24 + i * 38} w={78} h={28} r={3} fill={tok(e.startsWith('x') ? 'f1' : e.startsWith('y') ? 'f2' : 'f3', 0.16)} stroke={tok(e.startsWith('x') ? 'f1' : e.startsWith('y') ? 'f2' : 'f3')}>
              <T x={99 + j * 84} y={38 + i * 38} size={12} mono anchor="middle">{e}</T>
            </Box>
          ))}
        </g>
      ))}
      <T x={6} y={148} size={11} weight={700} fill={tok('muted')}>JAVASCRIPT Map: ALWAYS INSERTION ORDER</T>
      {['x: 3', 'vx: 1', 'y: 1'].map((e, j) => (
        <Box key={j} x={60 + j * 84} y={160} w={78} h={28} r={3} fill={tok('panel')} stroke={tok('ink', 0.5)}>
          <T x={99 + j * 84} y={174} size={12} mono anchor="middle">{e}</T>
        </Box>
      ))}
    </Svg>
  );
}
