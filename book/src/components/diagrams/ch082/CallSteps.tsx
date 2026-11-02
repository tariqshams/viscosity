// Chapter 82: call frames as records in an array, for
//   fn sq(x) { return x * x; }  fn f(y) { return sq(y) + 1; }  print f(3);
// The ip values are the companion's real offsets: the script's call is at
// 18 (so it resumes at 20); f's call is at 5 (it resumes at 7).
import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const CODE = `fn sq(x) {
  return x * x;
}
fn f(y) {
  return sq(y) + 1;
}
print f(3);`;

/** A frame record: function, ip (next offset to run in it), slots. */
type F = [string, number, number];
type S = { line: number; stack: string[]; frames: F[]; out?: string; note: string };

const STATES: S[] = [
  { line: 6, stack: ['script'], frames: [['script', 12, 0]], note: 'sq and f are defined. One frame exists: the script’s. Its ip, 12, is the next byte it will run, the start of print f(3).' },
  { line: 6, stack: ['script', 'fn f', '3'], frames: [['script', 18, 0]], note: 'The script pushes the function f and the argument 3. Next comes call 1 at offset 18.' },
  { line: 4, stack: ['script', 'fn f', '3'], frames: [['script', 20, 0], ['f', 0, 1]], note: 'call 1 pushes a NEW frame for f, starting at ip 0 of f’s own bytecode. The script’s frame keeps ip = 20: the byte after its call, where it will carry on later.' },
  { line: 4, stack: ['script', 'fn f', '3', 'fn sq', '3'], frames: [['script', 20, 0], ['f', 5, 1]], note: 'Only the newest frame runs. f pushes sq and a copy of y (load.local 1), ready for its own call at offset 5.' },
  { line: 1, stack: ['script', 'fn f', '3', 'fn sq', '3'], frames: [['script', 20, 0], ['f', 7, 1], ['sq', 0, 3]], note: 'A third frame, for sq. f’s frame now remembers ip 7, the + 1 still to do. Three calls are under way, and each record says where its own function is up to.' },
  { line: 1, stack: ['script', 'fn f', '3', 'fn sq', '3', '9'], frames: [['script', 20, 0], ['f', 7, 1], ['sq', 5, 3]], note: 'sq runs load.local 1 twice and mul, leaving 9. Its ip is 5, at its return.' },
  { line: 4, stack: ['script', 'fn f', '3', '9'], frames: [['script', 20, 0], ['f', 7, 1]], note: 'return pops the result, pops sq’s frame, clears sq’s part of the stack and pushes 9. The VM picks up the top frame again, f, at its saved ip 7.' },
  { line: 4, stack: ['script', 'fn f', '3', '10'], frames: [['script', 20, 0], ['f', 11, 1]], note: 'f carries on as if sq(y) had been a value all along: const 1, add, giving 10.' },
  { line: 6, stack: ['script', '10'], frames: [['script', 20, 0]], note: 'f returns 10 the same way. The script’s frame is on top again, and it resumes at 20, right after its call.' },
  { line: 6, stack: ['script'], frames: [['script', 21, 0]], out: '10', note: 'print pops 10 and prints it. At the deepest point there were three frames, yet the dispatch loop never called itself: it only pushed and popped records.' },
];

const CW = 62;

export default function CallSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="A frame per call, each with its own ip" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={226} title="The value stack as a row of cells, then the frames array as a table, newest frame on top, with each frame's function, ip and slots.">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>VALUE STACK</T>
        {st.stack.map((v, i) => (
          <Box key={i} x={8 + i * CW} y={22} w={CW - 4} h={28}>
            <T x={8 + i * CW + (CW - 4) / 2} y={36} size={11.5} mono anchor="middle">{v}</T>
          </Box>
        ))}
        <T x={8} y={72} size={11} weight={700} fill={tok('muted')}>FRAMES (newest on top)</T>
        <T x={150} y={72} size={11} mono fill={tok('muted')}>ip</T>
        <T x={220} y={72} size={11} mono fill={tok('muted')}>slots</T>
        {[...st.frames].reverse().map(([fn, ip, slots], k) => {
          const y = 82 + k * 34;
          const top = k === 0;
          return (
            <Box key={k} x={8} y={y} w={280} h={28} fill={top ? tok('brand', 0.14) : tok('panel')} stroke={top ? tok('brand') : tok('line')}>
              <T x={18} y={y + 14} size={12.5} mono weight={top ? 700 : 400}>{fn}</T>
              <T x={150} y={y + 14} size={12.5} mono>{ip}</T>
              <T x={220} y={y + 14} size={12.5} mono>{slots}</T>
              {top && <T x={296} y={y + 14} size={11} fill={tok('brand')}>running</T>}
            </Box>
          );
        })}
        <T x={8} y={210} size={12} mono>{st.out ? `output: ${st.out}` : ''}</T>
      </Svg>
    </StepFrame>
  );
}
