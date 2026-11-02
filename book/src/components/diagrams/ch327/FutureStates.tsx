import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 327: the shape of the state machine rustc generates for
//   async fn sum() -> u32 { let a = double(1).await;
//                          let b = double(20).await; a + b }
// as described in the Rust Reference (an async fn returns a future
// that saves its state at each .await) and measured with
// size_of_val(&sum()) == 16 bytes on rustc 1.97.0. The variant names
// are illustrative: the real type has no name you can write.
const ROWS = [
  { name: 'Start', holds: '(nothing yet)', y: 14 },
  { name: 'AwaitFirst', holds: 'double(1) future', y: 66 },
  { name: 'AwaitSecond', holds: 'a, double(20) future', y: 118 },
  { name: 'Done', holds: '(output returned)', y: 170 },
];

export default function FutureStates() {
  return (
    <Svg w={400} h={222} title="The four states of the sum future: start, waiting on the first double, waiting on the second with a saved, and done">
      {ROWS.map((r, i) => (
        <g key={r.name}>
          <Box x={10} y={r.y} w={150} h={38} fill={i === 2 ? tok('f2', 0.14) : tok('panel')} stroke={i === 2 ? tok('f2') : tok('line')}>
            <T x={22} y={r.y + 19} size={12} mono weight={700}>{r.name}</T>
          </Box>
          <T x={176} y={r.y + 19} size={11} fill={tok('muted')}>holds: </T>
          <T x={222} y={r.y + 19} size={11} mono>{r.holds}</T>
          {i < ROWS.length - 1 && <Arrow x1={60} y1={r.y + 38} x2={60} y2={r.y + 52} />}
        </g>
      ))}
      <T x={392} y={60} size={11} anchor="end" fill={tok('brand')}>each arrow: a poll</T>
      <T x={392} y={76} size={11} anchor="end" fill={tok('brand')}>that got Ready</T>
    </Svg>
  );
}
