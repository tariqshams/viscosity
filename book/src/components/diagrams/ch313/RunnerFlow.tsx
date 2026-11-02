import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 313: what the standard test harness does with each #[test]
// function (The Rust Programming Language, chapter 11.1: each test runs
// in a new thread, and a test whose thread panics is marked failed). The
// summary line is the shape rustc 1.97's harness prints.
export default function RunnerFlow() {
  return (
    <Svg w={400} h={240} title="For each test function the harness runs it on its own thread; returning means ok, panicking means FAILED">
      <Box x={120} y={6} w={160} h={34} fill={tok('panel')} stroke={tok('ink', 0.5)}>
        <T x={200} y={23} size={12} mono anchor="middle">#[test] fn t()</T>
      </Box>
      <Arrow x1={200} y1={42} x2={200} y2={62} />
      <Box x={90} y={64} w={220} h={34} fill={tok('brand', 0.1)} stroke={tok('brand')}>
        <T x={200} y={81} size={12} anchor="middle">run t on a thread of its own</T>
      </Box>
      <Arrow x1={170} y1={100} x2={92} y2={130} />
      <Arrow x1={230} y1={100} x2={308} y2={130} />
      <T x={110} y={112} size={11} anchor="end" fill={tok('muted')}>t returned</T>
      <T x={290} y={112} size={11} fill={tok('muted')}>t panicked</T>
      <Box x={20} y={132} w={150} h={34} fill={tok('safe', 0.15)} stroke={tok('safe')}>
        <T x={95} y={149} size={12} mono anchor="middle" fill={tok('safe')}>test t ... ok</T>
      </Box>
      <Box x={230} y={132} w={150} h={34} fill={tok('danger', 0.12)} stroke={tok('danger')}>
        <T x={305} y={149} size={12} mono anchor="middle" fill={tok('danger')}>test t ... FAILED</T>
      </Box>
      <T x={305} y={180} size={11} anchor="middle" fill={tok('muted')}>its panic message is printed</T>
      <line x1={4} y1={196} x2={396} y2={196} stroke={tok('line')} strokeWidth={1} />
      <T x={200} y={212} size={11} anchor="middle" fill={tok('muted')}>after every test, one summary line:</T>
      <T x={200} y={230} size={12} mono anchor="middle">test result: FAILED. 1 passed; 1 failed</T>
    </Svg>
  );
}
