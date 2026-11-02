import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// A made-up, simplified instruction set: one loop step of s += xs[i].
const CODE = `load r1, [r2]    ; r1 = xs[i]
add  r0, r0, r1  ; s = s + r1
add  r2, r2, 8   ; next element`;

type Phase = 'fetch' | 'decode' | 'execute';
type S = { line: number; phase: Phase; regs: [number, number, number]; mem?: boolean; changed?: number; note: string };

const STATES: S[] = [
  { line: 0, phase: 'fetch', regs: [0, 0, 16], note: 'The program is itself bytes in memory. First the CPU fetches the next instruction. Registers r0, r1 and r2 are its few tiny boxes of storage: r0 is our sum s, r2 holds the address of xs[0].' },
  { line: 0, phase: 'decode', regs: [0, 0, 16], note: 'Decode: work out what the instruction asks for. “Load the 8 bytes at the address in r2 into r1.”' },
  { line: 0, phase: 'execute', regs: [0, 2.5, 16], mem: true, changed: 1, note: 'Execute. This one has to reach out to memory, at address 16, for the value 2.5. Hold on to that: going to memory is the slow part, and it is the subject of this chapter.' },
  { line: 1, phase: 'fetch', regs: [0, 2.5, 16], note: 'Fetch the next instruction. The CPU just repeats this loop: fetch, decode, execute, billions of times a second.' },
  { line: 1, phase: 'execute', regs: [2.5, 2.5, 16], changed: 0, note: 'Add r1 to r0. Both numbers are already in registers, so this is about as fast as anything the CPU does.' },
  { line: 2, phase: 'execute', regs: [2.5, 2.5, 24], changed: 2, note: 'Add 8 to r2. Now it holds 24, the address of xs[1]. Chapter 26’s address arithmetic, done by the CPU itself. Then the loop starts over.' },
];

const PH: Phase[] = ['fetch', 'decode', 'execute'];

export default function CpuSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Fetch, decode, execute" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={176} title="A CPU with three stages, fetch, decode and execute, three registers, and memory holding xs">
        <Box x={8} y={8} w={232} h={160} r={8} stroke={tok('brand')} fill={tok('brand', 0.06)}>
          <T x={18} y={24} size={11} weight={700} fill={tok('brand')}>CPU</T>
          {PH.map((p, k) => (
            <g key={p}>
              <rect x={18 + k * 72} y={36} width={66} height={30} rx={5} fill={st.phase === p ? tok('brand', 0.85) : tok('paper')} stroke={tok('brand')} />
              <T x={51 + k * 72} y={51} size={12} anchor="middle" weight={700} fill={st.phase === p ? tok('panel') : tok('ink')}>{p}</T>
            </g>
          ))}
          <T x={18} y={86} size={11} weight={700} fill={tok('muted')}>REGISTERS</T>
          {st.regs.map((v, k) => (
            <g key={k}>
              <rect x={18 + k * 72} y={96} width={66} height={44} rx={5} fill={st.changed === k ? tok('warn', 0.35) : tok('paper')} stroke={tok('ink', 0.45)} />
              <T x={26 + k * 72} y={108} size={11} mono fill={tok('muted')}>r{k}</T>
              <T x={51 + k * 72} y={126} size={15} mono weight={700} anchor="middle">{v}</T>
            </g>
          ))}
          <T x={51} y={154} size={10} anchor="middle" fill={tok('muted')}>s</T>
          <T x={195} y={154} size={10} anchor="middle" fill={tok('muted')}>address</T>
        </Box>
        <T x={262} y={20} size={11} weight={700} fill={tok('muted')}>MEMORY</T>
        {[['16', '2.5'], ['24', '4'], ['32', '1.5']].map(([a, v], k) => (
          <g key={a}>
            <T x={290} y={50 + k * 34} size={11} mono anchor="end" fill={tok('muted')}>{a}</T>
            <rect x={296} y={36 + k * 34} width={96} height={28} rx={3} fill={tok('f1', 0.25)} stroke={st.mem && k === 0 ? tok('ink') : tok('line')} strokeWidth={st.mem && k === 0 ? 2 : 1} />
            <T x={344} y={50 + k * 34} size={13} mono anchor="middle">xs[{k}] = {v}</T>
          </g>
        ))}
        {st.mem && <Arrow x1={300} y1={64} x2={104} y2={98} bend={0.25} color={tok('accent')} dash />}
      </Svg>
    </StepFrame>
  );
}
