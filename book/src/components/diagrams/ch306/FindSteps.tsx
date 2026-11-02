import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// find walks a slice looking for t. Found: it returns Some(index). Not
// found: the loop ends and it returns None. The caller gets a slip that
// says which, and has to read it before it can use any index.

const CODE = `fn find(xs: &[i32], t: i32)
    -> Option<usize> {
    for i in 0..xs.len() {
        if xs[i] == t {
            return Some(i);
        }
    }
    None
}`;

const XS = [4, 5, 6];
type S = { line: number; t: number; i: number | null; hit?: boolean; out?: string; note: string };

const STATES: S[] = [
  { line: 0, t: 5, i: null, note: 'find(&xs, 5) is called with xs = [4, 5, 6]. Its return type, Option<usize>, already warns the caller: maybe an index, maybe not.' },
  { line: 3, t: 5, i: 0, note: 'i = 0: xs[0] is 4, not 5. The loop goes on.' },
  { line: 4, t: 5, i: 1, hit: true, out: 'Some(1)', note: 'i = 1: xs[1] is 5. return Some(i) wraps the index in the Some variant and leaves the function. The caller gets Some(1), not a bare 1.' },
  { line: 3, t: 9, i: 2, note: 'Now find(&xs, 9). Every comparison fails: 4, 5 and 6 are all different from 9.' },
  { line: 7, t: 9, i: null, out: 'None', note: 'The loop ends without returning, so the last expression, None, is the answer. There is no -1 and no undefined: just a variant that carries nothing.' },
];

export default function FindSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const bad = st.out === 'None';
  return (
    <StepFrame title="Some(index) or None" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={110} title="The slice being searched, the index being checked, and the Option that comes back">
        <T x={8} y={14} size={11} weight={700} fill={tok('muted')}>xs (looking for {st.t})</T>
        {XS.map((v, k) => (
          <Box key={k} x={8 + k * 52} y={26} w={48} h={40} r={3}
            fill={st.i === k ? tok(st.hit ? 'safe' : 'warn', 0.2) : tok('panel')} stroke={st.i === k ? tok(st.hit ? 'safe' : 'warn') : tok('line')}>
            <T x={32 + k * 52} y={46} size={15} mono weight={700} anchor="middle">{v}</T>
          </Box>
        ))}
        {XS.map((_, k) => <T key={k} x={32 + k * 52} y={80} size={11} mono anchor="middle" fill={tok('muted')}>{k}</T>)}
        <T x={240} y={14} size={11} weight={700} fill={tok('muted')}>RETURNED SLIP</T>
        <Box x={240} y={26} w={150} h={40} r={6} dash={!st.out}
          fill={st.out ? tok(bad ? 'muted' : 'safe', 0.14) : 'transparent'} stroke={st.out ? tok(bad ? 'muted' : 'safe') : tok('line')}>
          <T x={315} y={46} size={15} mono weight={700} anchor="middle">{st.out ?? ''}</T>
        </Box>
        {st.out && <T x={240} y={84} size={11} fill={tok('muted')}>{bad ? 'nothing inside' : 'an index inside'}</T>}
      </Svg>
    </StepFrame>
  );
}
