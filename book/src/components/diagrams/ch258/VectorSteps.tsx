import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// When getX(o) { return o.x; } gets its feedback vector, and what its one
// slot says, call by call. Measured with %DebugPrint(getX) after n calls,
// shapes cycling A, B, C ({x}, {x, a}, {x, b}), Node v22.23.4 (V8 12.4,
// --invocation-count-for-feedback-allocation=8 by default):
//   n = 8:  "No feedback vector, but we have a closure feedback cell array"
//   n = 9:  invocation count 1, slot #0 LoadProperty UNINITIALIZED
//   n = 10: invocation count 2, MONOMORPHIC
//   n = 11: invocation count 3, POLYMORPHIC
type S = { calls: number; vec: boolean; count: string; slot: string; seen: string; note: string };

const STATES: S[] = [
  { calls: 0, vec: false, count: '', slot: '', seen: '', note: 'getX has bytecode, and its GetNamedProperty names feedback slot [0]; but no feedback vector exists yet, so there is nowhere to write.' },
  { calls: 8, vec: false, count: '', slot: '', seen: 'A B C A B C A B', note: 'Eight calls, three shapes: %DebugPrint still says "No feedback vector". Nothing these calls saw is remembered. (The default of --invocation-count-for-feedback-allocation is 8.)' },
  { calls: 9, vec: true, count: '1', slot: 'UNINITIALIZED', seen: 'C', note: 'The ninth call allocates the vector. Its invocation count starts at 1, but slot 0 is still UNINITIALIZED: the shape this call saw was not recorded either.' },
  { calls: 10, vec: true, count: '2', slot: 'MONOMORPHIC', seen: 'A', note: 'The tenth call is the first one recorded: one shape, so the slot is MONOMORPHIC, as if the first nine calls had never happened.' },
  { calls: 11, vec: true, count: '3', slot: 'POLYMORPHIC', seen: 'A B', note: 'A second shape arrives and the slot becomes POLYMORPHIC. From here on it behaves as the inline cache of Shapes, inline caches and elements kinds describes; the vector also keeps the invocation count and the tiering state.' },
];

export default function VectorSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="When getX gets a feedback vector" steps={s} note={st.note}>
      <Svg w={400} h={210} title="Left: the function getX and how many times it has been called. Right: its feedback vector, drawn dashed and grey while it does not exist and in orange once it does, with the invocation count and slot 0's state, which is blue once it records a shape.">
        <T x={8} y={14} size={11} weight={700} fill={tok('muted')}>FUNCTION</T>
        <Box x={8} y={24} w={170} h={54} r={4} fill={tok('panel')} stroke={tok('line')}>
          <T x={16} y={42} size={12} mono>getX(o) {'{'} o.x {'}'}</T>
          <T x={16} y={62} size={11} fill={tok('muted')}>{`calls so far: ${st.calls}`}</T>
        </Box>
        <T x={8} y={102} size={11} fill={tok('muted')}>shapes of the calls in this step:</T>
        <T x={8} y={120} size={12} mono>{st.seen || '(none yet)'}</T>
        <T x={200} y={14} size={11} weight={700} fill={tok('muted')}>FEEDBACK VECTOR</T>
        <Box x={200} y={24} w={190} h={110} r={4} fill={st.vec ? tok('brand', 0.08) : tok('panel')} stroke={st.vec ? tok('brand') : tok('line')} dash={!st.vec}>
          {!st.vec && <T x={295} y={80} size={12} anchor="middle" fill={tok('muted')}>none yet</T>}
          {st.vec && <T x={210} y={46} size={11} mono>{`invocation count: ${st.count}`}</T>}
          {st.vec && <T x={210} y={72} size={11} mono>slot #0 LoadProperty</T>}
          {st.vec && (
            <Box x={210} y={84} w={170} h={24} r={3} fill={st.slot === 'UNINITIALIZED' ? tok('panel') : tok('accent', 0.15)} stroke={st.slot === 'UNINITIALIZED' ? tok('line') : tok('accent')}>
              <T x={295} y={96} size={12} mono anchor="middle">{st.slot}</T>
            </Box>
          )}
        </Box>
        <T x={8} y={170} size={11} fill={tok('muted')}>Node v22.23.4, read with %DebugPrint(getX) after each step</T>
      </Svg>
    </StepFrame>
  );
}
