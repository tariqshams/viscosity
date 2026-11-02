import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 192: six short programs at the edge of what Viscosity can do.
// Each "says" line is real `viscosity explain` output (TypeScript engine,
// 2026-10-31), wrapped to fit a phone.
type Case = { problem: string; kind: 'open' | 'gap'; code: string[]; says: string[]; verdict: 'kept' | 'soa' };

const CASES: Case[] = [
  {
    problem: 'Reordering: sort, swap', kind: 'open', verdict: 'kept',
    code: ['ps.sort((a, b) => a.x - b.x);'],
    says: ['unsafe: line 4: uses .sort on the array', '(only .length and .push are supported)'],
  },
  {
    problem: 'Records that vary', kind: 'open', verdict: 'kept',
    code: ['if (i % 2) ps.push({ x: i, vx: 1 });', 'else ps.push({ x: i, vx: 1, tag: \'a\' });'],
    says: ['unsafe: line 3: records with different', 'fields or field order', '({x, vx} vs {x, vx, tag})'],
  },
  {
    problem: 'Classes and constructors', kind: 'gap', verdict: 'kept',
    code: ['class P { constructor(x) { ... } }', 'ps.push(new P(i));'],
    says: ['unsafe: line 6: pushes something that', 'is not a fresh object literal'],
  },
  {
    problem: 'Other files (whole program)', kind: 'open', verdict: 'kept',
    code: ['export const ps = [];'],
    says: ['unsafe: the array is used by code', 'Viscosity doesn\'t model (export)', 'at line 1'],
  },
  {
    problem: 'Records inside records', kind: 'open', verdict: 'soa',
    code: ['ps.push({ pos: { x: i, y: 0 }, m: 1 });'],
    says: ['typed Float64Array columns for m;', 'plain array columns for pos', '(may hold non-numbers)'],
  },
  {
    problem: 'Not knowing the size', kind: 'open', verdict: 'soa',
    code: ['function make(n) {', '  for (let i = 0; i < n; i++) ...'],
    says: ['size unknown statically'],
  },
];

const STATES = [
  { hi: -1, note: 'Six short programs, each at an edge of what Viscosity can do. The words on the right are its real explain output. Step through: some are engineering gaps, others are open research problems.' },
  { hi: 0, note: 'Sorting moves whole records. With columns, every column must be permuted the same way, and the comparator receives elements that no longer exist as objects. Viscosity refuses any method but push.' },
  { hi: 1, note: 'Half the records have a tag. One shape per collection is the rule Viscosity relies on, so it refuses. Engines handle varying shapes with run-time checks; a compiler that must prove things can’t guess.' },
  { hi: 2, note: 'A class instance isn’t a fresh object literal, and the lowering treats class declarations as code it doesn’t model. This one is an engineering gap: understanding simple constructors is known technique, just not built here.' },
  { hi: 3, note: 'Exported means some other file might touch it. Viscosity analyzes one file at a time, so it refuses. Proving things about a whole program, possibly with code you can’t see, is a real research problem.' },
  { hi: 4, note: 'Transformed, but only halfway: pos is a column of objects, so pos.x is still a pointer chase. Flattening nested records into their own columns is what the multi-level research tackled inside a JIT.' },
  { hi: 5, note: 'Here Viscosity transforms with no size estimate at all. Whether that pays depends on n, which only the running program knows. A profile (chapter 183) helps, for the inputs you profiled.' },
];

export default function FrontierSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const c = st.hi >= 0 ? CASES[st.hi] : null;
  return (
    <StepFrame title="The edges of the map" steps={s} note={st.note}>
      <Svg w={400} h={300} title="A list of six kinds of program that Viscosity refuses or only partly transforms, with its real explain message for the highlighted one">
        {CASES.map((k, j) => {
          const y = 6 + j * 26;
          const on = j === st.hi;
          const col = k.kind === 'open' ? tok('accent') : tok('warn');
          return (
            <g key={k.problem} opacity={st.hi < 0 || on ? 1 : 0.4}>
              <Box x={4} y={y} w={392} h={22} r={4} fill={on ? tok('brand', 0.12) : tok('panel')} stroke={on ? tok('brand') : tok('line')}>
                <T x={12} y={y + 11.5} size={12} weight={on ? 700 : 500}>{k.problem}</T>
                <Box x={250} y={y + 3} w={54} h={16} r={8} fill={col} stroke={col} opacity={0.9}>
                  <T x={277} y={y + 11.5} size={9} weight={700} anchor="middle" fill={tok('paper')}>{k.kind === 'open' ? 'OPEN' : 'GAP'}</T>
                </Box>
                <T x={388} y={y + 11.5} size={10} mono anchor="end" fill={k.verdict === 'kept' ? tok('danger') : tok('safe')}>{k.verdict === 'kept' ? 'kept' : 'SoA'}</T>
              </Box>
            </g>
          );
        })}
        <Box x={4} y={168} w={392} h={128} fill={tok('panel')} stroke={c ? tok('brand') : tok('line')} dash={!c}>
          <T x={14} y={182} size={10} weight={700} fill={tok('muted')}>THE PROGRAM</T>
          {(c ? c.code : ['step through to see one']).map((l, j) => (
            <T key={j} x={14} y={200 + j * 15} size={11} mono={!!c}>{l}</T>
          ))}
          <T x={14} y={238} size={10} weight={700} fill={tok('muted')}>VISCOSITY EXPLAIN SAYS</T>
          {(c ? c.says : []).map((l, j) => (
            <T key={j} x={14} y={255 + j * 15} size={11} mono>{l}</T>
          ))}
        </Box>
      </Svg>
    </StepFrame>
  );
}
