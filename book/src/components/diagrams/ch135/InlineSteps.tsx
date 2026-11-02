// Chapter 135: inlining a call step by step: copy the body, bind the
// parameters to the arguments, rename the callee's locals so they can't
// clash with the caller's, turn `return` into the call's value, and let
// constant propagation and DCE clean up.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// Leading spaces are non-breaking so SVG keeps the indentation.
const CALLEE = ['function area(w, h) {', '\u00a0\u00a0const s = w * h;', '\u00a0\u00a0return s;', '}'];

type S = { caller: string[]; hl: number[]; calleeHl: number[]; map: string; note: string };

const STATES: S[] = [
  {
    caller: ['const s = 2;', 'const r = area(s, 5) + 1;', 'console.log(r);'],
    hl: [1], calleeHl: [], map: '',
    note: 'The call area(s, 5). Notice the caller has its own variable called s, and so does area. Two different variables, one name.',
  },
  {
    caller: ['const s = 2;', 'const s = w * h; // copied', 'return s; // copied', 'const r = area(s, 5) + 1;', 'console.log(r);'],
    hl: [1, 2], calleeHl: [1, 2], map: '',
    note: 'Step 1: copy the callee’s body into the caller, just before the statement that makes the call. It doesn’t make sense yet: w and h don’t exist here, and s is declared twice.',
  },
  {
    caller: ['const s = 2;', 'const s1 = w * h;', 'return s1;', 'const r = area(s, 5) + 1;', 'console.log(r);'],
    hl: [1, 2], calleeHl: [], map: 's → s1',
    note: 'Step 2: give each callee local a fresh name that the caller doesn’t use: s becomes s1. Without this, the copy would capture the caller’s s by accident.',
  },
  {
    caller: ['const s = 2;', 'const s1 = s * 5;', 'return s1;', 'const r = area(s, 5) + 1;', 'console.log(r);'],
    hl: [1], calleeHl: [], map: 's → s1 · w → s · h → 5',
    note: 'Step 3: replace each parameter by its argument: w by the caller’s s, h by 5. All renamings happen at once, so the s that replaces w can’t be renamed again.',
  },
  {
    caller: ['const s = 2;', 'const s1 = s * 5;', 'const r = s1 + 1;', 'console.log(r);'],
    hl: [2], calleeHl: [], map: 's → s1 · w → s · h → 5',
    note: 'Step 4: the return value becomes the value of the call. return s1 disappears, and area(s, 5) is replaced by s1. The call is gone: no frame, no jump, no return.',
  },
  {
    caller: ['const r = 11;', 'console.log(r);'],
    hl: [0], calleeHl: [], map: 's = 2 · s1 = 10 · r = 11',
    note: 'The payoff: now the optimizer can see through the call. Constant propagation finds s1 = 10 and r = 11, and DCE deletes s and s1, which nobody needs any more.',
  },
];

export default function InlineSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const LH = 22;
  const top2 = 24 + CALLEE.length * LH + 30;
  const h = top2 + 5 * LH + 44;
  return (
    <StepFrame title="Inlining area(s, 5)" steps={s} note={st.note}>
      <Svg w={400} h={h} title="The callee at the top, the caller being rewritten below">
        <T x={10} y={12} size={11} weight={700} fill={tok('muted')}>CALLEE</T>
        <Box x={10} y={22} w={380} h={CALLEE.length * LH + 8} r={6}>
          {CALLEE.map((l, k) => (
            <T key={k} x={20} y={34 + k * LH} size={13} mono fill={st.calleeHl.includes(k) ? tok('brand') : undefined} weight={st.calleeHl.includes(k) ? 700 : undefined}>{l}</T>
          ))}
        </Box>
        <T x={10} y={top2 - 10} size={11} weight={700} fill={tok('muted')}>CALLER</T>
        <Box x={10} y={top2} w={380} h={5 * LH + 8} r={6} fill={tok('brand', 0.06)} stroke={tok('brand', 0.6)}>
          {st.caller.map((l, k) => (
            <g key={k}>
              {st.hl.includes(k) && <rect x={14} y={top2 + 4 + k * LH} width={372} height={LH - 2} rx={3} fill={tok('accent', 0.16)} />}
              <T x={20} y={top2 + 15 + k * LH} size={13} mono>{l}</T>
            </g>
          ))}
        </Box>
        {st.map && <T x={10} y={h - 14} size={13} mono fill={tok('muted')}>{st.map}</T>}
      </Svg>
    </StepFrame>
  );
}
