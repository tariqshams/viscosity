import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Reading xs[1] from a packed and from a holey array, following the V8
// blog post "Elements kinds in V8" (2017): a hole is not undefined, so a
// read that finds one must continue along the prototype chain. The
// prototype step matches the chapter's runnable example, where setting
// Array.prototype[1] changes what xs[1] reads.
type S = { arr: (string | null)[]; at: 'arr' | 'ap' | 'op' | 'done'; found: string; note: string };

const STATES: S[] = [
  { arr: ['0', '1', '2'], at: 'arr', found: '1', note: 'Packed: [0, 1, 2]. Every index below the length has its own element, so xs[1] is a bounds check and a load. Done.' },
  { arr: ['0', null, '2'], at: 'arr', found: '', note: 'Holey: [0, , 2]. Index 1 is below the length (3), but the slot holds the special hole marker, not a value. The read cannot stop here.' },
  { arr: ['0', null, '2'], at: 'ap', found: '', note: 'A hole means "this array has no element 1", so the read looks where any missing property is looked for: the prototype, Array.prototype. Usually nothing is there.' },
  { arr: ['0', null, '2'], at: 'op', found: '', note: 'Then Array.prototype’s own prototype, Object.prototype. Still nothing.' },
  { arr: ['0', null, '2'], at: 'done', found: 'undefined', note: 'The end of the chain: xs[1] is undefined. Same answer as storing undefined, but found the long way, which is why V8 needs extra checks for holey arrays.' },
];

export default function HoleReadSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const holey = st.arr.includes(null);
  const hi = (k: S['at']) => st.at === k;
  return (
    <StepFrame title="Reading xs[1]" steps={s} note={st.note}>
      <Svg w={400} h={170} title="An array of three slots on the left, then Array.prototype and Object.prototype boxes along the prototype chain. The step being looked at is highlighted, and the value found is shown.">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>{holey ? 'xs = [0, , 2]  (HOLEY_SMI)' : 'xs = [0, 1, 2]  (PACKED_SMI)'}</T>
        {st.arr.map((v, k) => (
          <g key={k}>
            <Box x={8 + k * 44} y={24} w={40} h={34} r={3} dash={v === null}
              fill={k === 1 && hi('arr') ? tok('brand', 0.18) : v === null ? 'transparent' : tok('panel')}
              stroke={k === 1 && hi('arr') ? tok('brand') : v === null ? tok('muted') : tok('ink', 0.5)}>
              <T x={28 + k * 44} y={41} size={12} mono anchor="middle" fill={v === null ? tok('muted') : tok('ink')}>{v === null ? 'hole' : v}</T>
            </Box>
            <T x={28 + k * 44} y={68} size={11} mono anchor="middle" fill={tok('muted')}>{k}</T>
          </g>
        ))}
        {holey && <Arrow x1={140} y1={41} x2={176} y2={41} color={st.at === 'arr' ? tok('line') : tok('warn')} />}
        <Box x={180} y={24} w={100} h={34} fill={hi('ap') ? tok('warn', 0.15) : tok('panel')} stroke={hi('ap') ? tok('warn') : tok('line')} dash={!holey}>
          <T x={230} y={41} size={11} anchor="middle" fill={holey ? tok('ink') : tok('muted')}>Array.prototype</T>
        </Box>
        {holey && <Arrow x1={282} y1={41} x2={290} y2={41} color={st.at === 'op' || st.at === 'done' ? tok('warn') : tok('line')} />}
        <Box x={292} y={24} w={100} h={34} fill={hi('op') ? tok('warn', 0.15) : tok('panel')} stroke={hi('op') ? tok('warn') : tok('line')} dash={!holey}>
          <T x={342} y={41} size={11} anchor="middle" fill={holey ? tok('ink') : tok('muted')}>Object.prototype</T>
        </Box>
        <T x={8} y={100} size={11} weight={700} fill={tok('muted')}>xs[1] READS</T>
        <Box x={8} y={110} w={120} h={34} fill={st.found ? tok('safe', 0.15) : tok('panel')} stroke={st.found ? tok('safe') : tok('line')} dash={!st.found}>
          <T x={68} y={127} size={13} mono anchor="middle">{st.found || '…'}</T>
        </Box>
        <T x={140} y={127} size={11} fill={tok('muted')}>{holey ? `steps so far: ${['arr', 'ap', 'op', 'done'].indexOf(st.at) + 1}` : 'steps: 1'}</T>
      </Svg>
    </StepFrame>
  );
}
