// Chapter 236: software pipelining of the sum-of-squares loop over four
// elements, as a stage table. Each row is one pass; each column a stage
// (load, square, add); each cell names the trip (element) it works on.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const N = 4;
const STAGES = ['load', 'square', 'add'];
const ROWS = N + STAGES.length - 1;
const part = (t: number) => (t < STAGES.length - 1 ? 'prologue' : t >= N ? 'epilogue' : 'kernel');

type S = { upto: number; note: string };
const STATES: S[] = [
  { upto: -1, note: 'Four elements, three stages each: load x, square it, add it to the sum. Unpipelined, the trips run one after another, so each one\'s waits are wasted. Here each row is one pass of the new loop.' },
  { upto: 0, note: 'Row 0 (prologue): only element 0 has begun. We load it; there is nothing to square or add yet.' },
  { upto: 1, note: 'Row 1 (prologue): load element 1 while squaring element 0. Two trips are now in flight at once.' },
  { upto: 2, note: 'Row 2 (kernel): load 2, square 1, add 0. Every stage is busy, each on a different element. This row is the body of the pipelined loop.' },
  { upto: 3, note: 'Row 3 (kernel): the same three instructions again, one element further on: load 3, square 2, add 1. The kernel runs n - 2 times.' },
  { upto: 4, note: 'Row 4 (epilogue): there is nothing left to load, so the pipeline starts to drain: square 3, add 2.' },
  { upto: 5, note: 'Row 5 (epilogue): add 3, and the sum is complete. n + 2 rows in all for n elements: the start-up and the drain cost a little, once.' },
];

export default function PipeSteps() {
  const s = useSteps(STATES);
  const up = s.state.upto;
  const CW = 78;
  const X0 = 96;
  return (
    <StepFrame title="Three trips in flight at once" steps={s} note={s.state.note}>
      <Svg w={400} h={228} title="A table with rows 0 to 5 and columns load, square and add. Each cell shows which element that stage works on in that row; the first two rows are the prologue, the middle two the kernel and the last two the epilogue.">
        {STAGES.map((st, k) => (
          <T key={st} x={X0 + k * CW + CW / 2} y={12} size={11} weight={700} anchor="middle" fill={tok('muted')}>{st.toUpperCase()}</T>
        ))}
        {Array.from({ length: ROWS }, (_, t) => {
          const y = 24 + t * 33;
          const on = t <= up;
          const p = part(t);
          return (
            <g key={t} opacity={on ? 1 : 0.3}>
              <T x={8} y={y + 14} size={11} mono>row {t}</T>
              <T x={8} y={y + 26} size={11} fill={p === 'kernel' ? tok('brand') : tok('muted')}>{p}</T>
              {STAGES.map((_, k) => {
                const i = t - k;
                const has = i >= 0 && i < N;
                return (
                  <Box key={k} x={X0 + k * CW + 3} y={y} w={CW - 6} h={28}
                    fill={has && on ? (p === 'kernel' ? tok('brand', 0.16) : tok('f3', 0.14)) : 'transparent'}
                    stroke={has ? (p === 'kernel' ? tok('brand') : tok('line')) : tok('line', 0.4)} dash={!has}>
                    {has && <T x={X0 + k * CW + CW / 2} y={y + 14} size={13} mono anchor="middle">{`x${i}`}</T>}
                  </Box>
                );
              })}
            </g>
          );
        })}
      </Svg>
    </StepFrame>
  );
}
