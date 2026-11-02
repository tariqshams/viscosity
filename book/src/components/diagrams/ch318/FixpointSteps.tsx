import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 317-b: strictness analysis of a recursive function as a
// fixpoint over the two-point domain. Each round recomputes the abstract
// function's table from the previous guess.
const CODE = `sum(n, acc) =
  if n == 0 then acc
  else sum(n - 1, acc + n)

sum#(n, acc) =
  n ∧ (acc ∨ sum#(n, acc ∧ n))`;

type S = { line: number | null; round: string; tbl: (number | null)[]; note: string };

const IN = ['0 0', '0 1', '1 0', '1 1'];

const STATES: S[] = [
  { line: null, round: 'the rule', tbl: [null, null, null, null], note: 'Abstract values: 0 means "surely gives no value" (it loops or fails), 1 means "may give a value". The test n == 0 and the subtraction need n, so they become n; acc + n needs both, so it becomes acc ∧ n; an if needs its test and then one branch: c ∧ (t ∨ e).' },
  { line: 4, round: 'guess 0', tbl: [0, 0, 0, 0], note: 'sum# calls itself, so we cannot read it off directly. Start from the most pessimistic guess, sum# = 0 for every input (as if every call never returned), exactly like the fixpoints of chapter 196.' },
  { line: 5, round: 'round 1', tbl: [0, 0, 0, 1], note: 'Put the guess into the right-hand side. With sum# = 0 inside, the body is n ∧ (acc ∨ 0) = n ∧ acc: 1 only when both inputs are 1.' },
  { line: 5, round: 'round 2', tbl: [0, 0, 0, 1], note: 'Again, with round 1 inside: n ∧ (acc ∨ (n ∧ acc)) is still n ∧ acc. The table did not change, so this is the fixpoint, the answer.' },
  { line: 0, round: 'read off', tbl: [0, 0, 0, 1], note: 'sum#(0, 1) = 0, so sum is strict in n; sum#(1, 0) = 0, so it is strict in acc too. The compiler may evaluate acc + n at once instead of building a thunk: no chain, no leak.' },
];

export default function FixpointSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Finding strictness by iterating to a fixpoint" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={96} title="The table of sum# over its four inputs, for the current round">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>{`sum# TABLE: ${st.round.toUpperCase()}`}</T>
        <T x={8} y={38} size={11} mono fill={tok('muted')}>n acc</T>
        <T x={8} y={72} size={11} mono fill={tok('muted')}>sum#</T>
        {IN.map((x, i) => {
          const v = st.tbl[i];
          const hot = s.i === STATES.length - 1 && (i === 1 || i === 2);
          return (
            <g key={x}>
              <T x={92 + i * 76} y={38} size={12} mono anchor="middle">{x}</T>
              <Box x={66 + i * 76} y={54} w={52} h={30} dash={v === null} fill={v === null ? 'transparent' : hot ? tok('safe', 0.2) : v ? tok('f2', 0.15) : tok('panel')} stroke={hot ? tok('safe') : v ? tok('f2') : tok('line')}>
                <T x={92 + i * 76} y={69} size={14} mono anchor="middle">{v === null ? '?' : String(v)}</T>
              </Box>
            </g>
          );
        })}
      </Svg>
    </StepFrame>
  );
}
