import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const CODE = `function firstWhere<T>(
  xs: T[],
  ok: (x: T) => boolean,
): T | undefined { ... }

const big = firstWhere([3, 8, 12],
  (n) => n > 5);`;

type S = { line: number; t?: string; n?: string; result?: string; note: string };

const STATES: S[] = [
  { line: 0, note: 'The definition declares a blank, T. Nothing is known about T yet: it will be filled in afresh at every call.' },
  { line: 5, note: 'Here is a call. The checker has to work out T before it can check anything else in it.' },
  { line: 5, t: 'number', note: 'The first argument is [3, 8, 12], a number[]. It has to match xs: T[], so T must be number.' },
  { line: 6, t: 'number', n: 'number', note: 'Now the callback. Its parameter is x: T, and T is number, so n is a number. That is why n > 5 is allowed without any label on n.' },
  { line: 5, t: 'number', n: 'number', result: 'number | undefined', note: 'The result is T | undefined, so big is labelled number | undefined. Before doing arithmetic on big, you narrow away undefined.' },
  { line: 5, t: 'number', n: 'number', result: 'number | undefined', note: 'All of this happened in the checker. After erasure the call is plain JavaScript; T leaves no trace at run time.' },
];

export default function InferSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const row = (y: number, label: string, v?: string) => (
    <g>
      <T x={8} y={y + 14} size={12} mono weight={700}>{label}</T>
      <Box x={150} y={y} w={242} h={28} dash={!v} fill={v ? tok('accent', 0.12) : 'transparent'} stroke={v ? tok('accent') : tok('line')}>
        <T x={162} y={y + 14.5} size={13} mono weight={700} fill={v ? tok('accent') : tok('muted')}>{v ?? '?'}</T>
      </Box>
    </g>
  );
  return (
    <StepFrame title="How the checker fills in T" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={118} title="What the checker has worked out so far: T, the type of n, and the type of the result">
        <T x={8} y={10} size={11} weight={700} fill={tok('muted')}>WHAT THE CHECKER KNOWS SO FAR</T>
        {row(22, 'T', st.t)}
        {row(54, 'n (callback)', st.n)}
        {row(86, 'big', st.result)}
      </Svg>
    </StepFrame>
  );
}
