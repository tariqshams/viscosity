// Chapter 106 (second half): the interpreter's `frames` array, which records
// one entry per active Drip call (a name and a line) purely so that a
// runtime error can print a stack trace. An error does not pop it, so it
// still holds the calls that were active when the error happened.
import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const CODE = `fn area(w, h) {
  return w * h;
}
fn report(w) {
  print area(w, "x");
}
report(3);`;

type F = { place: string; line: number | string };
type S = { line: number; frames: F[]; err?: boolean; trace?: string[]; note: string };

const STATES: S[] = [
  { line: 0, frames: [{ place: 'script', line: 0 }], note: 'Before anything runs, frames holds one entry: the script itself. Its line will be filled in when it makes a call.' },
  { line: 6, frames: [{ place: 'script', line: 7 }, { place: 'fn report', line: 0 }], note: 'report(3) is called on line 7. callFunction first writes 7 into the caller’s entry (where the script is waiting), then pushes a new entry for report.' },
  { line: 4, frames: [{ place: 'script', line: 7 }, { place: 'fn report', line: 5 }, { place: 'fn area', line: 0 }], note: 'report calls area on line 5: report’s entry gets line 5, and an entry for area is pushed on top. Three Drip calls are active.' },
  { line: 1, frames: [{ place: 'script', line: 7 }, { place: 'fn report', line: 5 }, { place: 'fn area', line: 0 }], err: true, note: 'In area, w * h is 3 * "x". arithmetic throws a RuntimeError that remembers line 2. The throw leaves every method on the host stack, but nothing pops frames.' },
  { line: 1, frames: [{ place: 'script', line: 7 }, { place: 'fn report', line: 5 }, { place: 'fn area', line: 'error: 2' }], err: true, trace: ["runtime error: cannot use '*'", '  on a number and a string', '  at line 2 in fn area'], note: 'drip.ts catches the error and walks frames from the top. For the innermost entry it uses the error’s own line, 2.' },
  { line: 6, frames: [{ place: 'script', line: 7 }, { place: 'fn report', line: 5 }, { place: 'fn area', line: 'error: 2' }], err: true, trace: ["runtime error: cannot use '*'", '  on a number and a string', '  at line 2 in fn area', '  at line 5 in fn report', '  at line 7 in script'], note: 'For the calls further out, it uses the line each one was waiting on: the line of its call. Innermost first, the script last.' },
];

export default function TraceSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const base = 168;
  return (
    <StepFrame title="Building a stack trace" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={178} title="On the left, the interpreter's frames array, newest entry on top, each with a place and a line. On the right, the stack trace printed from it after the error.">
        <T x={6} y={10} size={11} weight={700} fill={tok('muted')}>FRAMES (newest on top)</T>
        {st.frames.map((f, k) => {
          const y = base - (k + 1) * 40;
          const top = k === st.frames.length - 1;
          return (
            <Box key={k} x={6} y={y} w={168} h={34} fill={top && st.err ? tok('danger', 0.1) : top ? tok('brand', 0.08) : tok('panel')} stroke={top && st.err ? tok('danger') : top ? tok('brand') : tok('ink', 0.4)}>
              <T x={16} y={y + 17} size={12.5} mono weight={700}>{f.place}</T>
              <T x={166} y={y + 17} size={12} mono anchor="end" fill={tok('muted')}>{`line ${f.line}`}</T>
            </Box>
          );
        })}
        <T x={188} y={10} size={11} weight={700} fill={tok('muted')}>PRINTED</T>
        {(st.trace ?? []).map((l, j) => (
          <T key={j} x={188} y={30 + j * 18} size={11} mono fill={j < 2 ? tok('danger') : undefined}>{l}</T>
        ))}
      </Svg>
    </StepFrame>
  );
}
