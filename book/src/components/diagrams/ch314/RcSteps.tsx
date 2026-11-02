import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 314: an Rc's strong count going up with each clone and down
// with each drop, on a value shaped like drip-rs's shared chunk. The
// printed counts (1, 3, 2) are the real output of the chapter's
// runnable example on rustc 1.97.
const CODE = `let chunk = Rc::new(code);
let f = Rc::clone(&chunk);
let g = chunk.clone();
drop(f);
// end of scope: g, then chunk`;

type V = 'chunk' | 'f' | 'g';
type S = { line: number; live: V[]; count: number; freed?: boolean; note: string };

const STATES: S[] = [
  { line: 0, live: ['chunk'], count: 1, note: 'Rc::new moves the value to the heap, next to a strong count of 1. The variable chunk holds a pointer to it.' },
  { line: 1, live: ['chunk', 'f'], count: 2, note: 'Rc::clone(&chunk) does not copy the value. It copies the pointer and adds 1 to the count: two owners now.' },
  { line: 2, live: ['chunk', 'f', 'g'], count: 3, note: 'chunk.clone() is the same operation written as a method call. Three owners, one value: Rc::strong_count says 3.' },
  { line: 3, live: ['chunk', 'g'], count: 2, note: 'drop(f) ends one owner early. The count falls to 2; the value is untouched, because others still own it.' },
  { line: 4, live: ['chunk'], count: 1, note: 'At the end of the scope variables are dropped in reverse order: g first, taking the count to 1.' },
  { line: 4, live: [], count: 0, freed: true, note: 'Then chunk: the count reaches 0, so the last owner drops the value and frees its memory, at exactly this point. No collector is involved.' },
];

const VARS: V[] = ['chunk', 'f', 'g'];

export default function RcSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Counting owners" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={150} title="Three variables pointing at one heap value that carries a strong count">
        <T x={8} y={14} size={11} weight={700} fill={tok('muted')}>VARIABLES</T>
        {VARS.map((v, k) => {
          const on = st.live.includes(v);
          const y = 26 + k * 40;
          return (
            <g key={v}>
              <Box x={8} y={y} w={74} h={30} fill={on ? tok('panel') : 'transparent'} stroke={on ? tok('brand') : tok('line')} dash={!on}>
                <T x={45} y={y + 15} size={12} mono anchor="middle" fill={on ? undefined : tok('muted')}>{v}</T>
              </Box>
              {on && <Arrow x1={84} y1={y + 15} x2={236} y2={70} color={tok('brand', 0.8)} width={1.5} />}
            </g>
          );
        })}
        <T x={240} y={14} size={11} weight={700} fill={tok('muted')}>HEAP</T>
        <Box x={240} y={36} w={150} h={70} fill={st.freed ? 'transparent' : tok('accent', 0.1)} stroke={st.freed ? tok('line') : tok('accent')} dash={st.freed}>
          <T x={252} y={56} size={12} mono fill={st.freed ? tok('muted') : tok('accent')} weight={700}>strong: {st.count}</T>
          <T x={252} y={84} size={12} mono fill={st.freed ? tok('muted') : undefined}>{st.freed ? 'freed' : 'the value'}</T>
        </Box>
      </Svg>
    </StepFrame>
  );
}
