import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// A tour of refusals from the differential corpus. For each program, the
// chain of uses from the collection to the first use Viscosity can't
// rewrite, and the real reason viscosity explain prints for it.
type Node = { t: string; kind: string; bad?: boolean };
type S = { file: string; chain: Node[]; reason: string; note: string };

const STATES: S[] = [
  {
    file: 'closure_alias.js',
    chain: [
      { t: 'ps', kind: 'collection' },
      { t: 'ps[3]', kind: 'index.get → element' },
      { t: 'const p = ps[3]', kind: 'storeBinding', bad: true },
      { t: '() => p.x', kind: 'not followed' },
    ],
    reason: 'line 4: an element is stored in another variable (p) at line 4',
    note: 'The element gets a second name, p, and a closure keeps it. After a rewrite there is no object for p to hold, so f() could no longer see the loop’s += 1. Viscosity stops at the store; it doesn’t follow p.',
  },
  {
    file: 'aliasing_identity.js',
    chain: [
      { t: 'ps', kind: 'collection' },
      { t: 'ps[i]', kind: 'index.get → element' },
      { t: 'keep.push(ps[i])', kind: 'push', bad: true },
      { t: 'keep[0].x = 42', kind: 'not followed' },
    ],
    reason: 'line 5: an element is used by push at line 5',
    note: 'Now another array holds the same objects. The write through keep[0] must show up in ps[0]. That only works if both arrays point at one real object, which a struct of arrays doesn’t have.',
  },
  {
    file: 'aliasing_identity.js',
    chain: [
      { t: 'ps', kind: 'collection' },
      { t: 'ps[0]', kind: 'index.get → element' },
      { t: 'keep[0] === ps[0]', kind: 'binop ===', bad: true },
    ],
    reason: 'line 7: an element is compared or combined with "===" at line 7',
    note: 'Nothing is stored here, yet this is the hardest one to fake. === asks whether two references name the same object. With columns there are no element objects, so there is nothing to be the same.',
  },
  {
    file: 'escapes_log.js',
    chain: [
      { t: 'ps', kind: 'collection' },
      { t: 'ps[3]', kind: 'index.get → element' },
      { t: 'console.log(ps[3])', kind: 'call (method)', bad: true },
    ],
    reason: 'line 5: an element is passed to a method call at line 5',
    note: 'console.log prints the whole object, { x: 4, y: 3 }. Any function Viscosity can’t see into could keep the element, compare it, or list its keys. Unknown code counts as code that observes.',
  },
  {
    file: 'map_method.js',
    chain: [
      { t: 'ps', kind: 'collection' },
      { t: 'ps.map(…)', kind: 'field.get .map', bad: true },
    ],
    reason: 'line 5: uses .map on the array (only .length and .push are supported)',
    note: 'Here the array itself escapes. Array methods hand real elements to callbacks and build new arrays of them. Viscosity models exactly two members of the array: length and push.',
  },
  {
    file: 'record_shared.js',
    chain: [
      { t: 'const r = { x: i }', kind: 'record.new' },
      { t: 'ps.push(r)', kind: 'use 1: push' },
      { t: 'r.x = 500', kind: 'use 2', bad: true },
    ],
    reason: 'line 6: the new record is also referenced elsewhere, so it could be aliased',
    note: 'The chain can start at a record, too. The literal has two uses: the push, and r.x = 500, which changes it after it was pushed. Viscosity accepts only a record whose single use is the push, so nothing else can reach it.',
  },
];

function wrap(text: string, n: number): string[] {
  const out: string[] = [];
  let cur = '';
  for (const w of text.split(' ')) {
    if (cur && (cur + ' ' + w).length > n) { out.push(cur); cur = w; } else cur = cur ? cur + ' ' + w : w;
  }
  if (cur) out.push(cur);
  return out;
}

export default function RefusalSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const after = st.chain.findIndex((c) => c.bad);
  return (
    <StepFrame title="A tour of refusals" steps={s} note={st.note}>
      <Svg w={400} h={300} title="A chain of uses from a collection to the use Viscosity cannot rewrite">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>{'CORPUS: ' + st.file}</T>
        {st.chain.map((n, k) => {
          const y = 28 + k * 50;
          const faded = k > after;
          const stroke = n.bad ? tok('danger') : faded ? tok('line') : tok('ink', 0.5);
          return (
            <g key={k} opacity={faded ? 0.45 : 1}>
              {k > 0 && <Arrow x1={130} y1={y - 16} x2={130} y2={y - 2} dash={faded} />}
              <Box x={20} y={y} w={220} h={32} fill={n.bad ? tok('danger', 0.12) : tok('panel')} stroke={stroke} dash={faded}>
                <T x={32} y={y + 16} size={13} mono>{n.t}</T>
              </Box>
              <T x={250} y={y + 16} size={11} mono fill={n.bad ? tok('danger') : tok('muted')}>{n.bad ? '← ' + n.kind : n.kind}</T>
            </g>
          );
        })}
        {wrap('unsafe: ' + st.reason, 54).map((l, k) => (
          <T key={k} x={8} y={240 + k * 17} size={11.5} mono fill={tok('danger')}>{l}</T>
        ))}
      </Svg>
    </StepFrame>
  );
}
