import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 432b: `ps[3].x = (more(), 77)` from the corpus program
// write_rhs_grows.js, where more() pushes one element. ps holds 128
// elements, so its container is full (cap 16 doubled to 128) and the push
// grows it: grow() makes new Float64Array columns of 256 and replaces
// this.x. Order of evaluation from ECMA-262: the left-hand side's reference
// is evaluated first, then the right-hand side, then PutValue.
// Printed results are real node v22 output: the original prints
// "130 77 6"; the old emitter's output (reproduced on a copy of engine/rust
// with the late-store branch disabled) prints "130 4 6"; the current
// emitter's output prints "130 77 6".
type Lane = 'orig' | 'old' | 'new';
type S = {
  lane: Lane; code: string; a: string; b: string | null; target?: 'a' | 'b' | 'obj';
  result?: string; bad?: boolean; note: string;
};

const CODE: Record<Lane, string> = {
  orig: 'ps[3].x = (more(), 77);',
  old: "ps.x[__vsc_bc(ps, 3, 'x', true)] = (more(), 77);",
  new: "__vsc_set(ps, 'x', __vsc_bk(ps, 3), (more(), 77), 'x');",
};

const STATES: S[] = [
  { lane: 'orig', code: 'left side: ps[3], then .x', a: '—', b: null, target: 'obj', note: 'The original. JavaScript evaluates the left side first, but only to a reference: “property x of the object ps[3]”. Nothing is stored yet.' },
  { lane: 'orig', code: 'right side: more() pushes; value 77', a: '—', b: null, target: 'obj', note: 'Then the right side. more() pushes a 129th object onto the array. ps[3] is still the same object.' },
  { lane: 'orig', code: 'store: that object’s x = 77', a: '—', b: null, target: 'obj', result: '130 77 6', note: 'Then the store, into the object the reference names. Later, ps[3].x reads 77.' },
  { lane: 'old', code: 'left side: ps.x, then index 3', a: '4', b: null, target: 'a', note: 'The emitter before the fix. The left side is ps.x[…]: evaluating it fetches the column now (column A, 128 slots) and runs the bounds check on 3.' },
  { lane: 'old', code: 'right side: more() pushes → grow()', a: '4', b: '4', target: 'a', note: 'The container was full, so the push calls grow(): a new Float64Array of 256 (column B), a copy of A, and this.x = B. The reference still names column A.' },
  { lane: 'old', code: 'store: A[3] = 77', a: '77', b: '4', target: 'a', bad: true, result: '130 4 6', note: 'The store goes into A, which nothing refers to any more. ps.x[3] reads B: 4. The write is lost, silently. Fuzzing found this (bug 12 in the README).' },
  { lane: 'new', code: 'arguments: ps, ’x’, __vsc_bk(ps, 3) = 3', a: '4', b: null, note: 'The fix. Arguments run left to right. __vsc_bk decides the bounds question before the right side runs, but doesn’t throw: out of bounds it returns NaN.' },
  { lane: 'new', code: 'argument: (more(), 77) → grow()', a: '4', b: '4', note: 'The right side runs as the fourth argument, and grows the container. No column has been fetched yet.' },
  { lane: 'new', code: 'inside __vsc_set: c[col][i] = v', a: '4', b: '77', target: 'b', result: '130 77 6', note: 'Only now does __vsc_set fetch c.x, which is column B, and store. A NaN index would throw “Cannot set properties of undefined” here, after the right side, as the original does.' },
];

const LANES: { id: Lane; label: string }[] = [
  { id: 'orig', label: 'original' },
  { id: 'old', label: 'before the fix' },
  { id: 'new', label: 'after the fix' },
];

export default function LateStoreSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const showCols = st.lane !== 'orig';
  return (
    <StepFrame title="When does the column get fetched?" steps={s} note={st.note}>
      <Svg w={400} h={232} title="A field write whose right-hand side grows the container, in the original program and in two compiled versions">
        {LANES.map((l, k) => (
          <Box key={l.id} x={4 + k * 132} y={4} w={128} h={24} r={4}
            fill={st.lane === l.id ? tok('brand', 0.16) : tok('panel')}
            stroke={st.lane === l.id ? tok('brand') : tok('line')}>
            <T x={68 + k * 132} y={16} size={11} anchor="middle" weight={st.lane === l.id ? 700 : 400}>{l.label}</T>
          </Box>
        ))}
        <T x={8} y={44} size={9.5} mono>{CODE[st.lane]}</T>
        <T x={8} y={66} size={12} weight={700}>{st.code}</T>
        {!showCols && (
          <Box x={110} y={88} w={180} h={64} r={6} fill={tok('safe', 0.1)} stroke={tok('safe')}>
            <T x={200} y={106} size={11} anchor="middle" fill={tok('muted')}>the object ps[3]</T>
            <T x={200} y={130} size={14} mono anchor="middle">{st.result ? '{ x: 77 }' : '{ x: 4 }'}</T>
          </Box>
        )}
        {showCols && (
          <g>
            <Box x={20} y={88} w={160} h={64} r={4} fill={st.b !== null ? tok('ink', 0.05) : tok('f1', 0.12)} stroke={st.target === 'a' ? (st.bad ? tok('danger') : tok('f1')) : tok('line')} dash={st.b !== null}>
              <T x={100} y={104} size={11} anchor="middle" fill={tok('muted')}>column A (128 slots)</T>
              <T x={100} y={130} size={14} mono anchor="middle" fill={st.bad ? tok('danger') : undefined}>x[3] = {st.a}</T>
            </Box>
            {st.b !== null && (
              <Box x={220} y={88} w={160} h={64} r={4} fill={tok('f1', 0.12)} stroke={st.target === 'b' ? tok('safe') : tok('f1')}>
                <T x={300} y={104} size={11} anchor="middle" fill={tok('muted')}>column B (256 slots)</T>
                <T x={300} y={130} size={14} mono anchor="middle">x[3] = {st.b}</T>
              </Box>
            )}
            {st.b !== null && <Arrow x1={182} y1={120} x2={218} y2={120} color={tok('ink', 0.4)} width={1.5} />}
            <T x={20} y={168} size={11} fill={tok('muted')}>ps.x now refers to column {st.b !== null ? 'B' : 'A'}</T>
          </g>
        )}
        {st.result && (
          <Box x={60} y={190} w={280} h={30} r={4} fill={st.bad ? tok('danger', 0.12) : tok('safe', 0.12)} stroke={st.bad ? tok('danger') : tok('safe')}>
            <T x={200} y={205} size={12} mono anchor="middle">prints: {st.result}</T>
          </Box>
        )}
      </Svg>
    </StepFrame>
  );
}
