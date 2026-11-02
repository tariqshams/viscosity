// One trip through the call in sumsq's loop (clang -O2, rv64im, with sq in
// another file): mv a0, s2 / call sq / addi s2, s2, 1 / add s1, a0, s1;
// and sq itself: mul a0, a0, a0 / ret.
import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const CODE = `loop:                # in sumsq
    mv   a0, s2      # argument: i
    call sq
    addi s2, s2, 1   # i += 1
    add  s1, a0, s1  # s += result
sq:
    mul  a0, a0, a0
    ret`;

type R = { a0: string; ra: string; s1: string; s2: string };
type S = { line: number; r: R; hot: (keyof R)[]; where: 'sumsq' | 'sq'; note: string };

const BASE: R = { a0: '?', ra: '?', s1: '5', s2: '3' };

const STATES: S[] = [
  { line: 1, r: { ...BASE, a0: '3' }, hot: ['a0'], where: 'sumsq', note: 'sumsq keeps i in s2 (3 on this trip) and s in s1 (0 + 1 + 4 = 5). The convention says the first argument goes in a0, so it copies i there.' },
  { line: 2, r: { ...BASE, a0: '3', ra: 'addi s2' }, hot: ['ra'], where: 'sq', note: 'call sq jumps to sq and, in the same step, writes the address of the next instruction (the addi) into ra, the return address register.' },
  { line: 6, r: { ...BASE, a0: '9', ra: 'addi s2' }, hot: ['a0'], where: 'sq', note: 'sq was compiled separately and knows nothing about sumsq. It finds its argument in a0 because the convention says so, and leaves the result in a0 for the same reason: 3 × 3 = 9.' },
  { line: 7, r: { ...BASE, a0: '9', ra: 'addi s2' }, hot: [], where: 'sumsq', note: 'ret is jalr x0, 0(ra): jump to the address in ra. Control is back in sumsq, at the addi right after the call.' },
  { line: 3, r: { ...BASE, a0: '9', ra: 'addi s2', s2: '4' }, hot: ['s2'], where: 'sumsq', note: 'i is still in s2, untouched by sq: s registers are ones a callee promises to keep (the next chapter shows how). i becomes 4.' },
  { line: 4, r: { ...BASE, a0: '9', ra: 'addi s2', s1: '14', s2: '4' }, hot: ['s1'], where: 'sumsq', note: 'The result is read from a0 and added to s: 5 + 9 = 14. Argument in a0, result in a0, return address in ra: that is the calling convention at work.' },
];

const NAMES: (keyof R)[] = ['a0', 'ra', 's1', 's2'];

export default function CallSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="A call, following the convention" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={92} title="Registers a0, ra, s1 and s2, and which function is running">
        {NAMES.map((n, k) => (
          <g key={n}>
            <T x={12 + k * 96} y={12} size={12} mono fill={tok('muted')}>{n}</T>
            <Box x={8 + k * 96} y={20} w={88} h={30} fill={st.hot.includes(n) ? tok('warn', 0.32) : tok('paper')} stroke={tok('ink', 0.5)}>
              <T x={52 + k * 96} y={35} size={n === 'ra' ? 11.5 : 14} mono anchor="middle">{st.r[n]}</T>
            </Box>
          </g>
        ))}
        <T x={8} y={76} size={12} fill={tok('muted')}>running:</T>
        <Box x={70} y={62} w={90} h={26} fill={st.where === 'sumsq' ? tok('f1', 0.25) : tok('f2', 0.25)} stroke={st.where === 'sumsq' ? tok('f1') : tok('f2')}>
          <T x={115} y={75} size={13} mono anchor="middle">{st.where}</T>
        </Box>
      </Svg>
    </StepFrame>
  );
}
