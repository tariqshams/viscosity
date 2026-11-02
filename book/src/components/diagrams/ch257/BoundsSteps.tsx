import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// The bounds-check helper Viscosity emits (BOUNDS_HELPER in
// engine/ts/packages/frontend-js/src/emit.ts), reflowed to fit, run on a
// container with length 100 and cap 128 for several indexes. `i >>> 0`
// reads i as an unsigned 32-bit integer, so it equals i only for whole
// numbers from 0 to 2^32 - 1.
const CODE = `function __vsc_bc(c, i, f, w) {
  if (i >>> 0 === i && i < c.length)
    return i;
  throw new TypeError(w
    ? \`Cannot set properties of …\`
    : \`Cannot read properties of …\`);
}`;

type S = { i: string; shr: string; whole: boolean | null; below: boolean | null; line: number | null; out: string; note: string };

const STATES: S[] = [
  { i: '', shr: '', whole: null, below: null, line: 0, out: '', note: 'Every access the analysis could not prove in bounds goes through this helper, with the container c, the index i, the field name f, and w: true for a write, false for a read. Here c.length is 100 and the columns have 128 slots.' },
  { i: '7', shr: '7', whole: true, below: true, line: 2, out: 'returns 7', note: 'ps[7].x: 7 >>> 0 is 7, the same number, so 7 is a whole number from 0 up; and 7 < 100. The helper returns 7, and the access becomes ps.x[7].' },
  { i: '100', shr: '100', whole: true, below: false, line: 5, out: 'TypeError', note: 'ps[100].x: a whole number, but not below the length. Slot 100 exists (cap is 128) and holds 0, so without this check the program would quietly print 0. Instead: “Cannot read properties of undefined (reading \'x\')”, as the original would have thrown.' },
  { i: '-1', shr: '4294967295', whole: false, below: null, line: 5, out: 'TypeError', note: 'ps[-1].x: -1 >>> 0 is 4294967295 (the same 32 bits read as unsigned), which is not -1. So -1 fails the first test. In the original, ps[-1] is undefined too.' },
  { i: '1.5', shr: '1', whole: false, below: null, line: 5, out: 'TypeError', note: 'ps[1.5].x: >>> 0 drops the fraction, giving 1, which is not 1.5. In the original, ps[1.5] is a property nobody set: undefined, and the same TypeError.' },
  { i: 'NaN', shr: '0', whole: false, below: null, line: 5, out: 'TypeError', note: 'ps[NaN].x: NaN >>> 0 is 0, and NaN equals nothing, not even itself. One comparison rules out negatives, fractions and NaN together.' },
];

export default function BoundsSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const mark = (v: boolean | null) => (v === null ? '–' : v ? 'yes' : 'no');
  const col = (v: boolean | null) => (v === null ? tok('muted') : v ? tok('safe') : tok('danger'));
  return (
    <StepFrame title="The bounds check, on five indexes" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={112} title="The index, i >>> 0, and the two tests of the bounds check">
        <T x={8} y={14} size={11} weight={700} fill={tok('muted')}>i</T>
        <T x={70} y={14} size={11} weight={700} fill={tok('muted')}>i &gt;&gt;&gt; 0</T>
        <T x={180} y={14} size={11} weight={700} fill={tok('muted')}>SAME?</T>
        <T x={240} y={14} size={11} weight={700} fill={tok('muted')}>i &lt; 100?</T>
        <T x={8} y={42} size={14} mono weight={700}>{st.i || '…'}</T>
        <T x={70} y={42} size={13} mono>{st.shr}</T>
        <T x={180} y={42} size={13} weight={700} fill={col(st.whole)}>{mark(st.whole)}</T>
        <T x={240} y={42} size={13} weight={700} fill={col(st.below)}>{mark(st.below)}</T>
        <Box x={6} y={66} w={388} h={38} fill={st.out === 'TypeError' ? tok('danger', 0.1) : st.out ? tok('safe', 0.1) : 'transparent'} stroke={st.out === 'TypeError' ? tok('danger') : st.out ? tok('safe') : tok('line')} dash={!st.out}>
          <T x={200} y={85} size={13} mono anchor="middle">{st.out ? (st.out === 'TypeError' ? 'throws TypeError' : st.out) : 'no index yet'}</T>
        </Box>
      </Svg>
    </StepFrame>
  );
}
