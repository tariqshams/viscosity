// Chapter 296-b: a load through a read barrier while objects are being
// evacuated (the shape of Baker's barrier and of Shenandoah's
// load-reference barrier in OpenJDK 21): a pointer into the region being
// emptied is replaced by the object's to-space copy, which the loading
// thread makes itself if nobody has yet, and the field is healed.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

type S = {
  copied: boolean; fwd: boolean; healed: boolean; v: '' | 'X' | "X'";
  code: string; path: '' | 'fast' | 'slow'; written?: boolean; note: string;
};

const STATES: S[] = [
  { copied: false, fwd: false, healed: false, v: '', code: 'v = R.f', path: '', note: 'The collector is emptying a region of the heap (the grey area on the left) while the program runs. R is outside it; its field f still points at X, inside it. The program is about to load R.f.' },
  { copied: false, fwd: false, healed: false, v: '', code: 'v = R.f', path: 'slow', note: 'The load goes through the barrier. Its fast test fails: the loaded pointer leads into the region being emptied. Handing X to the program now could let it write to a copy about to be thrown away.' },
  { copied: true, fwd: false, healed: false, v: '', code: 'v = R.f', path: 'slow', note: 'X has no copy yet, so the program\'s own thread makes one, X\', in to-space: the same copy Cheney\'s algorithm would make, done on demand.' },
  { copied: true, fwd: true, healed: false, v: '', code: 'v = R.f', path: 'slow', note: 'It publishes the copy by atomically setting X\'s forwarding pointer to X\'. If another thread had won that race, this thread would drop its own copy and use the winner\'s.' },
  { copied: true, fwd: true, healed: true, v: "X'", code: 'v = R.f', path: 'slow', note: 'The barrier heals the field: R.f now holds X\'s new address. Then it returns X\' to the program. The program never saw X.' },
  { copied: true, fwd: true, healed: true, v: "X'", code: 'v.balance = 15', path: '', written: true, note: 'The program writes through v, into X\', the copy that will survive. Compare the runnable example, where the write went to the old copy and was lost.' },
  { copied: true, fwd: true, healed: true, v: "X'", code: 'w = R.f', path: 'fast', note: 'The next load of R.f finds a to-space address: the fast test passes and the barrier costs a couple of instructions. Healing is what keeps most loads on this path.' },
];

export default function ReadBarrierSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="A load through a read barrier" steps={s} note={st.note}>
      <Svg w={400} h={236} title="A field R.f pointing at X in a region being emptied; the read barrier copies X to X' in to-space, forwards X, heals R.f and returns X'">
        <Box x={8} y={22} w={170} h={120} fill={tok('muted', 0.12)} stroke={tok('muted')} dash />
        <T x={14} y={14} size={11} weight={700} fill={tok('muted')}>BEING EMPTIED</T>
        <T x={222} y={14} size={11} weight={700} fill={tok('muted')}>TO-SPACE</T>
        <Box x={216} y={22} w={176} h={120} fill="transparent" stroke={tok('line')} />
        <Box x={40} y={70} w={70} h={36} fill={tok('panel')} stroke={tok('ink', 0.5)}>
          <T x={75} y={88} size={13} mono anchor="middle">X</T>
        </Box>
        {st.fwd && <T x={75} y={120} size={11} anchor="middle" fill={tok('warn')}>{"fwd → X'"}</T>}
        <Box x={236} y={36} w={60} h={30} fill={tok('panel')} stroke={tok('ink', 0.5)}>
          <T x={266} y={51} size={13} mono anchor="middle">R</T>
        </Box>
        {st.copied && (
          <Box x={300} y={86} w={70} h={36} fill={st.written ? tok('safe', 0.3) : tok('panel')} stroke={tok('safe')}>
            <T x={335} y={104} size={13} mono anchor="middle">{"X'"}</T>
          </Box>
        )}
        {st.copied && !st.fwd && <Arrow x1={112} y1={88} x2={296} y2={104} color={tok('safe')} dash />}
        {st.fwd && <Arrow x1={112} y1={100} x2={296} y2={110} color={tok('warn')} />}
        {st.healed
          ? <Arrow x1={290} y1={68} x2={322} y2={84} color={tok('ink', 0.7)} />
          : <Arrow x1={236} y1={58} x2={112} y2={76} color={tok('danger')} />}
        <T x={st.healed ? 300 : 170} y={st.healed ? 70 : 54} size={11} mono fill={tok('muted')}>R.f</T>
        <Box x={8} y={156} w={384} h={70} fill={tok('panel')} stroke={tok('line')}>
          <T x={18} y={174} size={11} weight={700} fill={tok('muted')}>PROGRAM</T>
          <T x={18} y={194} size={13} mono>{st.code}</T>
          <T x={18} y={214} size={12} mono fill={tok('muted')}>{st.v ? `v = ${st.v}` : 'v = ?'}</T>
          <T x={382} y={174} size={11} anchor="end" weight={700}
            fill={st.path === 'slow' ? tok('warn') : st.path === 'fast' ? tok('safe') : tok('muted')}>
            {st.path === 'slow' ? 'barrier: slow path' : st.path === 'fast' ? 'barrier: fast path' : ''}
          </T>
        </Box>
      </Svg>
    </StepFrame>
  );
}
