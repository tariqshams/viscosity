// Chapter 370: what the build profile and black_box do to one benchmark
// loop: 100 sums of a million f64s. Times are what the chapter's bb-play
// example printed on the book's shared cloud VM with rustc 1.97.0, three
// runs each: debug build 317-513 ms (plain) and 336-374 ms (boxed);
// release (-O) build 129-204 ns (plain, loop deleted) and 75-78 ms
// (boxed). The descriptions of what the optimizer did are inferred from
// those times, as the chapter says.
import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const PLAIN = `for _ in 0..100 {
    sum(&xs);
}`;
const BOXED = `for _ in 0..100 {
    black_box(sum(black_box(&xs)));
}`;

type S = { code: string; build: string; time: string; bar: number; verdict: string; tone: 'ok' | 'bad' | 'slow'; note: string };

const STATES: S[] = [
  { code: PLAIN, build: 'cargo run (dev profile)', time: '317–513 ms', bar: 1, verdict: 'every addition happens, slowly', tone: 'slow', note: 'The dev profile does no optimization: each step of sum runs as written, with values going to and from memory. The work is real, but the time tells you about the debug build, not about your code.' },
  { code: BOXED, build: 'cargo run (dev profile)', time: '336–374 ms', bar: 0.75, verdict: 'about the same', tone: 'slow', note: 'black_box changes little here, because a debug build was never going to delete anything. Debug times are the wrong numbers either way.' },
  { code: PLAIN, build: 'cargo run --release', time: '129–204 ns', bar: 0.004, verdict: 'the loop was deleted', tone: 'bad', note: 'A hundred million additions in under a microsecond did not happen. sum has no side effects and its result is dropped, so the optimizer removed the calls: dead code elimination.' },
  { code: BOXED, build: 'cargo run --release', time: '75–78 ms', bar: 0.18, verdict: 'the real cost of the work', tone: 'ok', note: 'With the input and the result passed through black_box, the compiler must assume both matter, so the sums run, now optimized: about four to six times faster than debug. This is the number to report.' },
];

export default function OptSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const color = st.tone === 'ok' ? 'safe' : st.tone === 'bad' ? 'danger' : 'warn';
  return (
    <StepFrame title="One loop, two builds, with and without black_box" steps={s} note={st.note}>
      <CodeTrace code={st.code} line={null} />
      <Svg w={400} h={104} title="The build used, the time measured, and a bar for the time on a common scale">
        <T x={8} y={14} size={12} weight={700} fill={tok('brand')}>{st.build}</T>
        <Box x={8} y={30} w={384} h={24} r={3} fill="transparent" stroke={tok('line')}>
          <rect x={9} y={31} width={Math.max(2, 382 * st.bar)} height={22} rx={2} fill={tok(color, 0.35)} />
        </Box>
        <T x={14} y={42} size={12} mono weight={700} fill={tok('ink')}>{st.time}</T>
        <T x={8} y={76} size={12} fill={tok(color)}>{st.verdict}</T>
        <T x={8} y={96} size={11} fill={tok('muted')}>bar: time for 100 sums of a million f64s</T>
      </Svg>
    </StepFrame>
  );
}
