// clang 18 -O2 (rv64im) for a five-case switch, run with k = 2:
//   li a2, 4; bltu a2, a0, default; slli a0, a0, 2;
//   lui/addi a2 = table; add a0, a0, a2; lw a0, 0(a0); jr a0
// The table holds one 4-byte address per case (.word).
import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const CODE = `li   a2, 4
bltu a2, a0, .Ldefault  # k > 4?
slli a0, a0, 2          # k * 4
lui  a2, %hi(.Ltable)
addi a2, a2, %lo(.Ltable)
add  a0, a0, a2         # &table[k]
lw   a0, 0(a0)          # table[k]
jr   a0                 # go there`;

type S = { line: number; a0: string; a2: string; entry: number | null; jump: boolean; note: string };

const STATES: S[] = [
  { line: 0, a0: '2', a2: '4', entry: null, jump: false, note: 'k = 2 arrives in a0. The cases are 0 to 4, so the largest valid k is 4; put it in a2.' },
  { line: 1, a0: '2', a2: '4', entry: null, jump: false, note: 'One unsigned comparison checks both ends: if 4 < k, unsigned, go to default. A negative k, read as unsigned, is a huge number, so it fails the same test. Here 4 < 2 is false: carry on.' },
  { line: 2, a0: '8', a2: '4', entry: null, jump: false, note: 'Each table entry is a 4-byte address, so scale k by 4 with a shift: 2 × 4 = 8. This is base plus index times size again, from the last chapter.' },
  { line: 4, a0: '8', a2: 'T', entry: null, jump: false, note: 'Build the table’s address T with lui and addi, exactly like a global variable.' },
  { line: 5, a0: 'T+8', a2: 'T', entry: 2, jump: false, note: 'Add them: a0 now points at entry 2 of the table.' },
  { line: 6, a0: 'case 2', a2: 'T', entry: 2, jump: false, note: 'Load the entry: the address of the code for case 2.' },
  { line: 7, a0: 'case 2', a2: 'T', entry: 2, jump: true, note: 'jr jumps to the address in a register. The same eight instructions run whatever k is: no chain of comparisons, however many cases there are.' },
];

export default function JumpSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="A switch through a jump table" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={190} title="Registers a0 and a2, the five-entry table, and the code for each case">
        <T x={8} y={14} size={12} mono fill={tok('muted')}>a0</T>
        <Box x={32} y={2} w={82} h={24} fill={tok('paper')} stroke={tok('ink', 0.5)}>
          <T x={73} y={14} size={12} mono anchor="middle">{st.a0}</T>
        </Box>
        <T x={128} y={14} size={12} mono fill={tok('muted')}>a2</T>
        <Box x={152} y={2} w={60} h={24} fill={tok('paper')} stroke={tok('ink', 0.5)}>
          <T x={182} y={14} size={12} mono anchor="middle">{st.a2}</T>
        </Box>
        <T x={8} y={44} size={11} weight={700} fill={tok('muted')}>TABLE T (4 bytes each)</T>
        {[0, 1, 2, 3, 4].map((k) => (
          <g key={k}>
            <T x={40} y={66 + k * 24} size={11} mono anchor="end" fill={tok('muted')}>T+{k * 4}</T>
            <Box x={46} y={55 + k * 24} w={100} h={22} fill={st.entry === k ? tok('f2', 0.4) : tok('f2', 0.1)} stroke={tok('f2')}>
              <T x={96} y={66 + k * 24} size={11.5} mono anchor="middle">→ case {k}</T>
            </Box>
          </g>
        ))}
        <T x={236} y={44} size={11} weight={700} fill={tok('muted')}>CODE</T>
        {['case 0', 'case 1', 'case 2', 'case 3', 'case 4', 'default'].map((c, k) => (
          <Box key={c} x={236} y={52 + k * 22} w={110} h={19} fill={st.jump && k === 2 ? tok('brand', 0.3) : tok('panel')} stroke={st.jump && k === 2 ? tok('brand') : tok('line')}>
            <T x={291} y={62 + k * 22} size={11.5} mono anchor="middle">{c}</T>
          </Box>
        ))}
        {st.jump && <Arrow x1={148} y1={114} x2={234} y2={106} color={tok('accent')} />}
      </Svg>
    </StepFrame>
  );
}
