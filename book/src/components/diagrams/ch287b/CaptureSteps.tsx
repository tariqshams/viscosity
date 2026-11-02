import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 287b: swap(tmp, y) expanded naively, then hygienically. The
// naive expansion's own tmp captures the caller's tmp; renaming the
// macro's variable to tmp_1 keeps them apart.
const NAIVE = `let tmp = 1; let y = 2;
{
  let tmp = tmp;
  tmp = y;
  y = tmp;
}`;
const CLEAN = `let tmp = 1; let y = 2;
{
  let tmp_1 = tmp;
  tmp = y;
  y = tmp_1;
}`;

type V = [string, string, boolean?];
type S = { code: string; line: number | null; outer: V[]; inner: V[]; note: string };

const STATES: S[] = [
  { code: NAIVE, line: 0, outer: [['tmp', '1'], ['y', '2']], inner: [], note: 'The caller happens to have a variable called tmp, and writes swap(tmp, y). Below is the naive expansion of a macro whose template is let tmp = a; a = b; b = tmp;.' },
  { code: NAIVE, line: 2, outer: [['tmp', '1'], ['y', '2']], inner: [['tmp', '?', true]], note: 'The macro’s let tmp makes a new tmp in the block. From here on, every tmp in the block means this new one, including the caller’s argument: tmp = tmp reads the new variable, which has no value yet (C reads whatever was in memory; JavaScript would throw).' },
  { code: NAIVE, line: 3, outer: [['tmp', '1'], ['y', '2']], inner: [['tmp', '2', true]], note: 'tmp = y was meant to change the caller’s tmp, but it changes the macro’s.' },
  { code: NAIVE, line: 4, outer: [['tmp', '1'], ['y', '2']], inner: [['tmp', '2', true]], note: 'y = tmp copies the macro’s tmp back into y. The block ends: tmp is still 1 and y still 2. In C, which this mirrors, nothing was swapped and nothing was reported.' },
  { code: CLEAN, line: 2, outer: [['tmp', '1'], ['y', '2']], inner: [['tmp_1', '1']], note: 'A hygienic expander renames the variables the template itself introduces. The macro’s variable is now tmp_1, and tmp means the caller’s tmp again.' },
  { code: CLEAN, line: 3, outer: [['tmp', '2'], ['y', '2']], inner: [['tmp_1', '1']], note: 'tmp = y sets the caller’s tmp to 2.' },
  { code: CLEAN, line: 4, outer: [['tmp', '2'], ['y', '1']], inner: [['tmp_1', '1']], note: 'y = tmp_1 sets y to the old tmp: the values are swapped, as the caller meant.' },
];

export default function CaptureSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const row = (vs: V[], y: number, x0: number) => vs.map(([n, v, bad], k) => (
    <Box key={n} x={x0 + k * 92} y={y} w={84} h={30} fill={bad ? tok('f6', 0.15) : tok('panel')} stroke={bad ? tok('f6') : tok('line')}>
      <T x={x0 + k * 92 + 42} y={y + 15} size={12} mono anchor="middle">{`${n} = ${v}`}</T>
    </Box>
  ));
  return (
    <StepFrame title="swap(tmp, y): captured, then kept apart" steps={s} note={st.note}>
      <CodeTrace code={st.code} line={st.line} />
      <Svg w={400} h={92} title="The caller's variables and the macro's own variable, with their values">
        <T x={6} y={12} size={11} weight={700} fill={tok('muted')}>CALLER</T>
        {row(st.outer, 22, 6)}
        <T x={206} y={12} size={11} weight={700} fill={tok('muted')}>MACRO’S BLOCK</T>
        {st.inner.length ? row(st.inner, 22, 206) : <T x={206} y={37} size={11} fill={tok('muted')}>(not entered yet)</T>}
        <T x={6} y={74} size={11} fill={tok('muted')}>{st.code === NAIVE ? 'naive expansion' : 'hygienic expansion: the macro’s tmp renamed'}</T>
      </Svg>
    </StepFrame>
  );
}
