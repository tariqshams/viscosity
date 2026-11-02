// Chapter 236: walking backwards through sumsq's loop body b2, keeping the
// live set, and adding an interference edge at each definition.
import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Svg, T, tok } from '../../viz/svg';

const CODE = `b2: mul  t, i1, i1
    add  s2, s1, t
    addi i2, i1, 1
    mv   s1, s2
    mv   i1, i2
    j    b1`;

type S = { line: number | null; live: string; added: string[]; skip?: string; note: string };
const STATES: S[] = [
  { line: 5, live: 'i1 n s1', added: [], note: 'Start at the bottom of b2. It jumps to b1, so what is live here is in(b1) = {i1, n, s1}: the loop test reads i1 and n, and s1 is read later. j b1 defines nothing.' },
  { line: 4, live: 'i1 n s1', added: ['i1–n', 'i1–s1'], skip: 'i2', note: 'mv i1, i2 defines i1 while n and s1 are live: two edges. It is a copy of i2, so no edge with i2: they hold the same value. Then i1 leaves the live set and i2 joins it.' },
  { line: 3, live: 'i2 n s1', added: ['i1–n', 'i1–s1', 's1–i2', 's1–n'], skip: 's2', note: 'Live after mv s1, s2: {i2, n, s1}. s1 is defined, so it interferes with i2 and n, but not with its copy source s2. Above it, s1 is dead and s2 is live: {i2, n, s2}.' },
  { line: 2, live: 'i2 n s2', added: ['i1–n', 'i1–s1', 's1–i2', 's1–n', 'i2–n', 'i2–s2'], note: 'addi i2, i1, 1 defines i2 with n and s2 live: edges i2–n and i2–s2. Above it, i2 is gone and i1 is read: {i1, n, s2}.' },
  { line: 1, live: 'i1 n s2', added: ['i1–n', 'i1–s1', 's1–i2', 's1–n', 'i2–n', 'i2–s2', 's2–i1', 's2–n'], note: 'add s2, s1, t defines s2 with i1 and n live: two more edges. Above it, s2 is gone and s1 and t are read: {i1, n, s1, t}.' },
  { line: 0, live: 'i1 n s1 t', added: ['i1–n', 'i1–s1', 's1–i2', 's1–n', 'i2–n', 'i2–s2', 's2–i1', 's2–n', 't–i1', 't–n', 't–s1'], note: 'mul t, i1, i1 defines t while i1, n and s1 are live: three edges. Four values are live at once just after this line, so this loop needs at least four registers.' },
];

export default function LiveWalkSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Live sets and edges, bottom to top" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={96} title="The live set after the highlighted line, and the interference edges found so far.">
        <T x={8} y={14} size={11} weight={700} fill={tok('muted')}>LIVE AFTER THIS LINE</T>
        <T x={8} y={34} size={14} mono weight={700} fill={tok('brand')}>{`{${st.live.split(' ').join(', ')}}`}</T>
        {st.skip && <T x={200} y={34} size={12} fill={tok('safe')}>{`no edge with ${st.skip} (copy)`}</T>}
        <T x={8} y={58} size={11} weight={700} fill={tok('muted')}>{`EDGES SO FAR (${st.added.length})`}</T>
        <T x={8} y={76} size={12} mono>{st.added.slice(0, 6).join('  ') || '(none)'}</T>
        <T x={8} y={92} size={12} mono>{st.added.slice(6).join('  ')}</T>
      </Svg>
    </StepFrame>
  );
}
