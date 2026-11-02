import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 386: one call of mean(xs.as_ptr(), 3) across the "C" ABI on
// x86-64 Linux (System V). The registers are the ones gcc 13.3 -O1
// used in the compiled mean: pointer in rdi, count in rsi, result in
// xmm0. The address 0x7ffd...a0 is illustrative.
const CODE = `unsafe {
    mean(xs.as_ptr(), xs.len())
}
// C: double mean(const double *xs,
//                size_t n)`;

type S = { line: number; rdi: string; rsi: string; xmm0: string; side: 'rust' | 'c' | 'back'; note: string };
const STATES: S[] = [
  { line: 1, rdi: '', rsi: '', xmm0: '', side: 'rust', note: 'Rust has a slice of three f64s: [1.0, 2.0, 6.0]. C cannot take a slice, so Rust splits it into the two things C wants: the address of the first element and the count.' },
  { line: 1, rdi: '0x7ffd…a0', rsi: '3', xmm0: '', side: 'rust', note: 'The "C" ABI says where they go. On x86-64 Linux the first pointer or integer argument goes in register rdi, the second in rsi. Rust puts them there, because the extern block said "C".' },
  { line: 3, rdi: '0x7ffd…a0', rsi: '3', xmm0: '', side: 'c', note: 'The call jumps into C. gcc compiled mean expecting exactly this: it reads rdi as the pointer and rsi as n, then loads xs[0], xs[1], xs[2] through the pointer. Nothing checks that rdi really points at three doubles.' },
  { line: 3, rdi: '0x7ffd…a0', rsi: '3', xmm0: '3.0', side: 'c', note: 'C adds them up (9.0), divides by 3 and leaves the double result in register xmm0, where the ABI says a floating-point result goes.' },
  { line: 1, rdi: '', rsi: '', xmm0: '3.0', side: 'back', note: 'Back in Rust, the call expression reads xmm0 as an f64: 3.0. Both sides agreed on every register, and that agreement is all "C" means.' },
];

function Reg({ x, name, v }: { x: number; name: string; v: string }) {
  return (
    <Box x={x} y={104} w={118} h={46} r={4} fill={v ? tok('f2', 0.15) : tok('panel')} stroke={v ? tok('f2') : tok('line')}>
      <T x={x + 10} y={118} size={11} mono fill={tok('muted')}>{name}</T>
      <T x={x + 10} y={137} size={12} mono>{v || '—'}</T>
    </Box>
  );
}

export default function BoundarySteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="A call across the C ABI" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={160} title="Rust and C on either side of the boundary, and the three registers that carry the call">
        <Box x={8} y={10} w={180} h={74} fill={st.side !== 'c' ? tok('f1', 0.15) : tok('panel')} stroke={tok('f1')}>
          <T x={18} y={30} size={12} weight={700} fill={tok('f1')}>Rust</T>
          <T x={18} y={52} size={11} mono>xs = [1.0, 2.0, 6.0]</T>
          <T x={18} y={70} size={11} mono>{st.side === 'back' ? 'm = 3.0' : 'safe_mean(&xs)'}</T>
        </Box>
        <Box x={212} y={10} w={180} h={74} fill={st.side === 'c' ? tok('f3', 0.15) : tok('panel')} stroke={tok('f3')}>
          <T x={222} y={30} size={12} weight={700} fill={tok('f3')}>C (gcc)</T>
          <T x={222} y={52} size={11} mono>mean(xs, n)</T>
          <T x={222} y={70} size={11} mono>{st.side === 'c' ? 'reading xs[0..3]' : ''}</T>
        </Box>
        <T x={200} y={94} size={11} anchor="middle" fill={tok('muted')}>the "C" ABI: registers both sides agree on</T>
        <Reg x={8} name="rdi (arg 1)" v={st.rdi} />
        <Reg x={141} name="rsi (arg 2)" v={st.rsi} />
        <Reg x={274} name="xmm0 (result)" v={st.xmm0} />
      </Svg>
    </StepFrame>
  );
}
