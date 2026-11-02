import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 289: the Python emitter's edits, one at a time. The final text is
// the real output of `viscosity build` for this program (with
// "# @viscosity soa" above the list); the dataclass definition and the
// prelude are left out to fit.
const LINES = [
  'ps = []',
  'for i in range(1000):',
  '    ps.append(P(float(i), 1.0))',
  'for p in ps:',
  '    p.x += p.vx',
  'print(ps[3].x)',
];
const AFTER = [
  'ps = _Vsc_ps()',
  'for i in range(1000):',
  '    ps.append(float(i), 1.0)',
  'for p in _vsc_iter(ps):',
  '    ps.x[p] += ps.vx[p]',
  'print(ps.x[_vsc_ix(ps, 3)])',
];

type S = { done: number[]; line: number | null; from?: string; to?: string; prelude?: boolean; note: string };

const STATES: S[] = [
  { done: [], line: null, note: 'The plan says: ps becomes a struct of arrays. The emitter does not regenerate the program. It collects a list of edits (source ranges and their new text) and leaves every other character alone.' },
  { done: [0], line: 0, from: '[]', to: '_Vsc_ps()', note: 'The list’s creation becomes a new container, an instance of a class generated for ps. A literal like [P(1.0, 2.0), P(3.0, 4.0)] would become _Vsc_ps._of(1.0, 2.0, 3.0, 4.0) instead.' },
  { done: [0, 2], line: 2, from: 'P(float(i), 1.0)', to: 'float(i), 1.0', note: 'The record call is replaced by its arguments, so append now receives one value per column. Keywords and defaults are put in field order here, from the same rules the lowering used.' },
  { done: [0, 2, 3], line: 3, from: 'ps', to: '_vsc_iter(ps)', note: 'The element loop now walks indexes. _vsc_iter re-checks the length on every step, like iterating a list, so appending inside the loop still behaves the same. From here on p is an int, not an object.' },
  { done: [0, 2, 3, 4], line: 4, from: 'p.x  ·  p.vx', to: 'ps.x[p]  ·  ps.vx[p]', note: 'Each field access on an element becomes a column read or write at that index. These are proven in bounds (p comes from the loop), so there is no check.' },
  { done: [0, 2, 3, 4, 5], line: 5, from: 'ps[3].x', to: 'ps.x[_vsc_ix(ps, 3)]', note: 'A constant index is not proven, so it goes through _vsc_ix, which accepts exactly -n ≤ i < n and otherwise raises IndexError(\'list index out of range\'), as the list would.' },
  { done: [0, 2, 3, 4, 5], line: null, prelude: true, note: 'Finally the edits are applied from the back of the file to the front, so earlier offsets stay valid, and the prelude goes in at the top: the array import, the two helpers and the class, after any leading comments, docstring or __future__ imports.' },
];

export default function EmitSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const code = LINES.map((l, k) => (st.done.includes(k) ? AFTER[k] : l)).join('\n');
  return (
    <StepFrame title="Rewriting Python, one edit at a time" steps={s} note={st.note}>
      <CodeTrace code={code} line={st.line} />
      <Svg w={400} h={96} title="The current edit: the source text replaced and its new text">
        {st.prelude ? (
          <Box x={8} y={8} w={384} h={80} fill={tok('f5', 0.15)} stroke={tok('f5')}>
            <T x={18} y={26} size={11} mono>from array import array as _vsc_array</T>
            <T x={18} y={44} size={11} mono>def _vsc_ix(c, i): …</T>
            <T x={18} y={62} size={11} mono>def _vsc_iter(c): …</T>
            <T x={18} y={80} size={11} mono>class _Vsc_ps: …</T>
          </Box>
        ) : (
          <g>
            <T x={10} y={12} size={11} weight={700} fill={tok('muted')}>REPLACE</T>
            <Box x={8} y={20} w={384} h={26} fill={st.from ? tok('f6', 0.12) : 'transparent'} stroke={st.from ? tok('f6') : tok('line')} dash={!st.from}>
              <T x={18} y={33} size={12} mono>{st.from ?? '—'}</T>
            </Box>
            <T x={10} y={56} size={11} weight={700} fill={tok('muted')}>WITH</T>
            <Box x={8} y={64} w={384} h={26} fill={st.to ? tok('f4', 0.15) : 'transparent'} stroke={st.to ? tok('f4') : tok('line')} dash={!st.to}>
              <T x={18} y={77} size={12} mono>{st.to ?? '—'}</T>
            </Box>
          </g>
        )}
      </Svg>
    </StepFrame>
  );
}
