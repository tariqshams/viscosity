import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// Numeric inference on a loop, in SSA terms. Each value is "number" or
// "maybe not". Optimistic: values on a cycle start as "number" (a guess) and
// can only be knocked down. Pessimistic: they start as "maybe not" and the
// cycle can never prove itself.
const CODE = `let v = 0;
for (let i = 0; i < 100; i++) {
  ps.push({ x: v });
  v = v + STEP;
}`;

type F = 'num' | 'guess' | 'not' | '';
type Row = { name: string; def: string };
const ROWS: Row[] = [
  { name: 'v0', def: '0' },
  { name: 'c', def: 'STEP' },
  { name: 'v1', def: 'phi(v0, v2)' },
  { name: 'v2', def: 'v1 + c' },
  { name: 'ps.x', def: 'column (stores v1)' },
];

type S = { step: string; f: F[]; note: string; line: number | null };
const STATES: S[] = [
  { step: '0.5', line: null, f: ['', '', '', '', ''], note: 'With STEP = 0.5. In SSA, v becomes v0 before the loop, v1 (a phi) at the loop header and v2 after the add. Is the x column always a number? Then it can be a Float64Array.' },
  { step: '0.5', line: 0, f: ['num', 'num', 'guess', 'guess', 'guess'], note: 'Optimistic start. Constants are easy: 0 and 0.5 are numbers. But v1 depends on v2, which depends on v1: a cycle. Viscosity guesses “number” for the cycle and the field, and will knock down any guess that turns out wrong.' },
  { step: '0.5', line: 3, f: ['num', 'num', 'num', 'num', 'num'], note: 'Round 1. v1 = phi(number, number guess) is a number. v2 = v1 + c: + of two numbers is a number. The column only ever stores v1: a number.' },
  { step: '0.5', line: 3, f: ['num', 'num', 'num', 'num', 'num'], note: 'Round 2: recompute everything. Nothing changes, so this is a fixpoint. Every guess survived: the x column gets a Float64Array.' },
  { step: '0.5', line: 1, f: ['num', 'num', 'not', 'not', 'not'], note: 'Compare a pessimistic start: assume v1 “maybe not” until proven. Then v2 = v1 + c is “maybe not”, so v1 = phi(number, maybe not) stays “maybe not”. The cycle can never prove itself, and a perfectly numeric loop is lost.' },
  { step: "'!'", line: 3, f: ['num', 'not', 'guess', 'guess', 'guess'], note: "Now make STEP a string, '!'. Optimistic start again: v1, v2 and the column are guessed “number”, but c is not a number." },
  { step: "'!'", line: 3, f: ['num', 'not', 'num', 'not', 'num'], note: 'Round 1: v2 = v1 + c, and c may not be a number (+ might join strings), so v2 is knocked down to “maybe not”.' },
  { step: "'!'", line: 2, f: ['num', 'not', 'not', 'not', 'not'], note: 'Round 2: v1 = phi(v0, v2) now has a “maybe not” input, so it falls. The column stores v1, so it falls too. Round 3 changes nothing: fixpoint. The x column becomes a plain array.' },
];

const LABEL: Record<F, string> = { num: 'number', guess: 'number?', not: 'maybe not', '': '' };
const COLOR: Record<F, string> = { num: 'safe', guess: 'warn', not: 'danger', '': 'muted' };

export default function LatticeSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="The numeric lattice on a loop" steps={s} note={st.note}>
      <CodeTrace code={CODE.replace('STEP', st.step)} line={st.line} />
      <Svg w={400} h={232} title="Each SSA value with its current fact: number, guessed number, or maybe not a number">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>VALUE</T>
        <T x={392} y={12} size={11} weight={700} anchor="end" fill={tok('muted')}>FACT</T>
        {ROWS.map((r, k) => {
          const f = st.f[k];
          const y = 24 + k * 36;
          const c = COLOR[f];
          return (
            <Box key={k} x={4} y={y} w={392} h={30} fill={f ? tok(c, 0.1) : 'transparent'} stroke={f ? tok(c) : tok('line')} dash={!f || f === 'guess'}>
              <T x={14} y={y + 15} size={13} mono weight={700}>{r.name}</T>
              <T x={70} y={y + 15} size={12} mono fill={tok('muted')}>{r.def.replace('STEP', st.step)}</T>
              <T x={386} y={y + 15} size={13} weight={700} anchor="end" fill={tok(c)}>{LABEL[f]}</T>
            </Box>
          );
        })}
        <T x={14} y={214} size={11} fill={tok('muted')}>Facts only move down: number → maybe not.</T>
      </Svg>
    </StepFrame>
  );
}
