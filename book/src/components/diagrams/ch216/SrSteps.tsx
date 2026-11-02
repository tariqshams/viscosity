// Chapter 215-b: strength reduction, then induction variable elimination,
// on the loop that reads a[2 * i + 1], shown as source code at each stage.
import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';

const ORIG = `for (let i = 0; i < n; i++) {
  const j = 2 * i + 1;
  s += a[j];
}`;

const REDUCED = `let j = 1;     // 2 * 0 + 1
for (let i = 0; i < n; i++) {
  s += a[j];
  j += 2;      // 2 * 1
}`;

const TEST = `let j = 1;
const end = 2 * n + 1;
for (let i = 0; j < end; i++) {
  s += a[j];
  j += 2;
}`;

const FINAL = `let j = 1;
const end = 2 * n + 1;
for (; j < end; j += 2) {
  s += a[j];
}`;

type S = { code: string; line: number | null; note: string };

const STATES: S[] = [
  { code: ORIG, line: 1, note: 'The loop multiplies on every trip: j = 2 * i + 1. In family terms, j is [i, c = 2, d = 1], and i starts at 0 and steps by 1.' },
  { code: REDUCED, line: 0, note: 'Strength reduction, part 1: give j its own variable, started before the loop (in the preheader) at c × 0 + d = 1.' },
  { code: REDUCED, line: 3, note: 'Part 2: step it at the end of each trip by c × 1 = 2. The multiply is gone from the loop; j still goes 1, 3, 5, 7...' },
  { code: TEST, line: 2, note: 'Induction variable elimination: i is now used only by the test. Since c = 2 is positive, i < n holds exactly when j < 2n + 1, so test j against a bound computed once, before the loop.' },
  { code: FINAL, line: 2, note: 'Nothing reads i any more, so dead code elimination deletes it. One variable, one add and one comparison per trip, and the only multiply runs once, in the preheader.' },
];

export default function SrSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="From a multiply to an add, and one counter fewer" steps={s} note={st.note}>
      <CodeTrace code={st.code} line={st.line} />
    </StepFrame>
  );
}
