// p.x += p.vx on RISC-V: clang -O2 (18.1.3, rv64im) for
//   struct P { long x, vx; };  void step(struct P *p) { p->x += p->vx; }
// gives ld a1, 8(a0) / ld a2, 0(a0) / add a1, a2, a1 / sd a1, 0(a0) / ret.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';
import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';

const CODE = `ld  a1, 8(a0)    # a1 = p.vx
ld  a2, 0(a0)    # a2 = p.x
add a1, a2, a1   # a1 = x + vx
sd  a1, 0(a0)    # p.x = a1
ret`;

type S = { line: number | null; a1: string; a2: string; px: number; arrow?: 'vx' | 'x' | 'st'; note: string };

const STATES: S[] = [
  { line: null, a1: '?', a2: '?', px: 5, note: 'The particle p lives in memory at address 1000: x at 1000 and vx eight bytes later, at 1008. The function received p as an address in a0. No register holds x or vx yet.' },
  { line: 0, a1: '2', a2: '?', px: 5, arrow: 'vx', note: 'ld (load doubleword) copies 8 bytes from address a0 + 8 = 1008 into a1. That is the only way a value gets from memory into a register.' },
  { line: 1, a1: '2', a2: '5', px: 5, arrow: 'x', note: 'A second load brings p.x (address a0 + 0) into a2. Both operands are now inside the processor.' },
  { line: 2, a1: '7', a2: '5', px: 5, note: 'add works on registers only: a1 = 5 + 2 = 7. Memory has not changed; p.x is still 5.' },
  { line: 3, a1: '7', a2: '5', px: 7, arrow: 'st', note: 'sd (store doubleword) copies a1 back to address a0 + 0. Four instructions for one line of source: two loads, one add, one store.' },
];

export default function LoadStoreSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const reg = (x: number, name: string, v: string, hot: boolean) => (
    <g>
      <T x={x} y={44} size={12} mono fill={tok('muted')}>{name}</T>
      <Box x={x + 26} y={30} w={70} h={28} fill={hot ? tok('warn', 0.3) : tok('paper')} stroke={tok('ink', 0.5)}>
        <T x={x + 61} y={44} size={13} mono anchor="middle">{v}</T>
      </Box>
    </g>
  );
  return (
    <StepFrame title="Only loads and stores reach memory" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={176} title="Registers a0, a1 and a2 inside the processor, and the particle's two fields in memory">
        <Box x={4} y={6} w={392} h={66} r={8} fill={tok('brand', 0.06)} stroke={tok('brand')}>
          <T x={14} y={18} size={11} weight={700} fill={tok('brand')}>REGISTERS</T>
          {reg(14, 'a0', '1000', false)}
          {reg(142, 'a1', st.a1, st.line === 0 || st.line === 2)}
          {reg(270, 'a2', st.a2, st.line === 1)}
        </Box>
        <T x={14} y={104} size={11} weight={700} fill={tok('muted')}>MEMORY</T>
        <T x={120} y={126} size={11} mono anchor="end" fill={tok('muted')}>1000</T>
        <Box x={128} y={112} w={120} h={28} fill={tok('f1', st.line === 3 ? 0.45 : 0.2)} stroke={tok('f1')}>
          <T x={188} y={126} size={13} mono anchor="middle">x = {st.px}</T>
        </Box>
        <T x={120} y={156} size={11} mono anchor="end" fill={tok('muted')}>1008</T>
        <Box x={128} y={142} w={120} h={28} fill={tok('f3', 0.2)} stroke={tok('f3')}>
          <T x={188} y={156} size={13} mono anchor="middle">vx = 2</T>
        </Box>
        {st.arrow === 'vx' && <Arrow x1={250} y1={154} x2={200} y2={60} bend={-0.3} color={tok('accent')} />}
        {st.arrow === 'x' && <Arrow x1={250} y1={124} x2={320} y2={60} bend={0.2} color={tok('accent')} />}
        {st.arrow === 'st' && <Arrow x1={190} y1={60} x2={230} y2={112} bend={0.2} color={tok('accent')} />}
      </Svg>
    </StepFrame>
  );
}
