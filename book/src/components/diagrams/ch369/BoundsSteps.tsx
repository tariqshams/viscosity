import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 369: the bounds proof in engine/rust/crates/core/src/analysis.rs
// (bounds_loops_and_sizes, is_counting_phi, non_neg_int), applied to the
// four element reads of a small program. The verdicts are the real ones:
// `viscosity explain` (rustc 1.97 release build) says "2 of 4 element
// accesses proven in bounds", and a debug dump of IndexGet::bounds_proven
// gives true for both reads on line 6 and false for lines 8 and 9.
const CODE = [
  'const ps = [];',
  'for (let i = 0; i < 300; i++)',
  '  ps.push({ x: i });',
  'for (let i = 0; i < ps.length; i++)',
  '  for (let j = i + 1; j < ps.length; j++)',
  '    ps[j].x -= ps[i].x;',
  'for (let k = -1; k < ps.length; k++)',
  '  ps[k + 1].x += 1;',
  'console.log(ps[1].x);',
];

type Mark = 'yes' | 'no' | 'skip';
type S = { line: number | null; what: string; checks: Mark[]; verdict?: string; ok?: boolean; note: string };

const CHECKS = [
  'index is a phi in the header of a loop around the access',
  'counting: starts at a non-negative integer, steps by +1',
  'the header tests index < ps.length (one conjunct is enough)',
  'the true edge of that test dominates the access',
];

const STATES: S[] = [
  { line: null, what: 'four reads of ps', checks: ['skip', 'skip', 'skip', 'skip'], note: 'Four element reads: ps[j] and ps[i] on line 6, ps[k + 1] on line 8, ps[1] on line 9. Each index.get gets the same four questions, and is proven only if all four say yes.' },
  { line: 5, what: 'ps[j]', checks: ['yes', 'skip', 'skip', 'skip'], note: 'j is the phi at the top of the inner loop, and that loop contains line 6. So far so good.' },
  { line: 5, what: 'ps[j]', checks: ['yes', 'yes', 'skip', 'skip'], note: 'j starts at i + 1. That is not 0, but non_neg_int says yes: a sum of non-negative integers, where i is a phi of 0 and i + 1. The step j++ is j + 1.' },
  { line: 5, what: 'ps[j]', checks: ['yes', 'yes', 'yes', 'yes'], verdict: 'proven', ok: true, note: 'The inner header tests j < ps.length, and the loop body (where line 6 is) is only reached through its true edge. Proven: ps.x[j], no check.' },
  { line: 5, what: 'ps[i]', checks: ['yes', 'yes', 'yes', 'yes'], verdict: 'proven', ok: true, note: 'i is defined in the outer header, not the innermost loop. The port searches any loop whose header defines the index and that contains the access, so the outer loop and its i < ps.length guard count.' },
  { line: 7, what: 'ps[k + 1]', checks: ['no', 'skip', 'skip', 'skip'], verdict: 'not proven', note: 'The index is k + 1, an addition, not the loop’s phi. The proof stops at the first question. (Had the index been k itself, the start −1 would fail the second.)' },
  { line: 7, what: 'ps[k + 1]', checks: ['no', 'skip', 'skip', 'skip'], verdict: '__vsc_bc(ps, k + 1, …)', note: 'Rightly so: on the last trip k is ps.length − 1, so k + 1 is ps.length. The original throws “Cannot read properties of undefined (reading ’x’)”, and so does the compiled program, through the check.' },
  { line: 8, what: 'ps[1]', checks: ['no', 'skip', 'skip', 'skip'], verdict: 'not proven', note: 'A constant index outside every loop. The analysis doesn’t compare 1 with a length it can’t know at compile time, so this read is checked too. Total: 2 of 4 proven.' },
];

export default function BoundsSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const col = (m: Mark) => (m === 'yes' ? tok('safe') : m === 'no' ? tok('danger') : tok('muted'));
  const sym = (m: Mark) => (m === 'yes' ? '✓' : m === 'no' ? '✗' : '·');
  return (
    <StepFrame title="Is this index in bounds?" steps={s} note={st.note}>
      <Svg w={400} h={300} title="A short program with four element reads, and the four questions the bounds proof asks about each">
        {CODE.map((l, k) => (
          <g key={k}>
            {st.line === k && <rect x={4} y={6 + k * 16} width={392} height={16} fill={tok('brand', 0.15)} />}
            <T x={8} y={14 + k * 16} size={10.5} mono fill={tok('muted')}>{String(k + 1).padStart(2)}</T>
            <T x={28} y={14 + k * 16} size={10.5} mono>{l}</T>
          </g>
        ))}
        <T x={8} y={168} size={12} weight={700}>{st.what}</T>
        {CHECKS.map((c, k) => (
          <g key={k}>
            <T x={14} y={190 + k * 20} size={14} weight={700} fill={col(st.checks[k])}>{sym(st.checks[k])}</T>
            <T x={32} y={190 + k * 20} size={10.5} fill={st.checks[k] === 'skip' ? tok('muted') : undefined}>{c}</T>
          </g>
        ))}
        {st.verdict && (
          <Box x={8} y={268} w={384} h={26} r={4} fill={st.ok ? tok('safe', 0.12) : tok('danger', 0.12)} stroke={st.ok ? tok('safe') : tok('danger')}>
            <T x={200} y={281} size={12} mono anchor="middle">{st.verdict}</T>
          </Box>
        )}
      </Svg>
    </StepFrame>
  );
}
