import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Svg, T, tok } from '../../viz/svg';

// A toy predictor: "this if will go the same way it went last time",
// starting with a guess of false. Real predictors are far cleverer, but
// they share its weakness: no pattern, no good guesses.
const CODE = `for (const v of xs) {
  if (v < 50) s += v;
}`;

const UNSORTED = [12, 30, 71, 5, 88, 64, 47, 93];
const SORTED = [...UNSORTED].sort((a, b) => a - b);

function run(xs: number[]) {
  let last = false;
  return xs.map((v) => {
    const actual = v < 50;
    const guess = last;
    last = actual;
    return { v, actual, guess, ok: guess === actual };
  });
}

type S = { show: number; sortedToo: boolean; note: string };
const STATES: S[] = [
  { show: 0, sortedToo: false, note: 'This loop has an if inside. The CPU must guess which way it goes long before v < 50 is worked out. Our toy predictor guesses “same as last time”, starting with false.' },
  { show: 4, sortedToo: false, note: 'Unsorted data, first four values. The answers jump between true (T) and false (F), so “same as last time” is often wrong (✗).' },
  { show: 8, sortedToo: false, note: 'All eight: 6 wrong guesses out of 8. Each wrong guess throws away work in the pipeline.' },
  { show: 8, sortedToo: true, note: 'The same values, sorted. Now all the small ones come first: T, T, T, T, then F, F, F, F. The predictor is wrong only twice: at the very start, and at the switch.' },
  { show: 8, sortedToo: true, note: 'Same values, same sum, same instructions. Only the order changed, and with it the number of wrong guesses. On real data with thousands of elements the gap grows: random data keeps fooling the predictor, while sorted data has just one switch.' },
];

function Row({ y, label, xs, show }: { y: number; label: string; xs: number[]; show: number }) {
  const rows = run(xs);
  const wrong = rows.slice(0, show).filter((r) => !r.ok).length;
  return (
    <g>
      <T x={8} y={y - 10} size={12} weight={700}>{label}</T>
      {['value', 'guess', 'actual', ''].map((t, k) => (
        <T key={k} x={50} y={y + 12 + k * 20} size={10} anchor="end" fill={tok('muted')}>{t}</T>
      ))}
      {rows.map((r, i) => {
        const x = 56 + i * 38;
        const on = i < show;
        return (
          <g key={i}>
            <rect x={x} y={y} width={34} height={22} rx={3} fill={tok('paper')} stroke={tok('line')} />
            <T x={x + 17} y={y + 11} size={12} mono anchor="middle">{r.v}</T>
            {on && (
              <>
                <T x={x + 17} y={y + 32} size={12} mono anchor="middle" fill={tok('muted')}>{r.guess ? 'T' : 'F'}</T>
                <T x={x + 17} y={y + 52} size={12} mono weight={700} anchor="middle">{r.actual ? 'T' : 'F'}</T>
                <T x={x + 17} y={y + 72} size={13} weight={700} anchor="middle" fill={r.ok ? tok('safe') : tok('danger')}>{r.ok ? '✓' : '✗'}</T>
              </>
            )}
          </g>
        );
      })}
      {show > 0 && <T x={362} y={y - 10} size={12} mono anchor="end" weight={700} fill={tok('danger')}>wrong: {wrong}</T>}
    </g>
  );
}

export default function BranchSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Guessing an if: unsorted vs sorted" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={1} />
      <Svg w={400} h={st.sortedToo ? 214 : 108} title="A branch predictor guessing the outcome of v < 50 for unsorted and sorted values">
        <Row y={24} label="unsorted" xs={UNSORTED} show={st.show} />
        {st.sortedToo && <Row y={130} label="sorted" xs={SORTED} show={8} />}
      </Svg>
    </StepFrame>
  );
}
