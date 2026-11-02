import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 432: emit_js in engine/rust/crates/frontend-js/src/emit.rs on this
// chapter's g1.js. Every edit replaces one byte range of the source; edits
// are sorted by start, last first, and applied with String::replace_range,
// so an edit never moves the offsets of the edits still to come. The byte
// ranges are the real ones for g1.js; the final text is what
// `viscosity build g1.js` printed (rustc 1.97 release build). The push's
// object literal is really three edits (around each value); it is shown as
// one here.
const START = [
  'const ps = [];',
  'for (let i = 0; i < 100; i++)',
  '  ps.push({ x: i, vx: 1 });',
  'for (let i = 0; i < ps.length; i++)',
  '  ps[i].x += ps[i].vx;',
  'console.log(ps[99].x);',
];

type E = { range: string; from: string; to: string };
const EDITS: E[] = [
  { range: '144..152', from: 'ps[99].x', to: "ps.x[__vsc_bc(ps, 99, 'x', false)]" },
  { range: '122..130', from: 'ps[i].vx', to: 'ps.vx[i]' },
  { range: '111..118', from: 'ps[i].x', to: 'ps.x[i]' },
  { range: '55..70', from: '{ x: i, vx: 1 }', to: 'i, 1' },
  { range: '11..13', from: '[]', to: 'new __Vsc_ps()' },
];
const LINE_OF = [5, 4, 4, 2, 0];

type S = { done: number; prelude?: boolean; note: string };
const STATES: S[] = [
  { done: 0, note: 'The emitter never prints the program again from its IR. It collects edits, each a byte range of the original text and its replacement, and copies everything else through untouched, comments and spacing included.' },
  { done: 1, note: 'The edits are sorted by start, largest first. The last one, at bytes 144..152, goes first: ps[99] is a constant index outside any loop, not proven in bounds, so it gets the check.' },
  { done: 2, note: 'Bytes 122..130 next. Replacing text here changes the length of everything after it, but nothing after it is still waiting, so no offset goes stale.' },
  { done: 3, note: 'Bytes 111..118: a proven read-and-write, so a bare index. ps[i].x became ps.x[i]: field first, index second.' },
  { done: 4, note: 'The push: the object literal disappears and its values become arguments, push(i, 1), in field order.' },
  { done: 5, note: 'The creation: [] becomes new __Vsc_ps(). Every edit applied so far lay after this one, so applying back to front never needed to recompute a position.' },
  { done: 5, prelude: true, note: 'Last, the prelude (the container class, and __vsc_bc because one access needed it) goes on top, after any #! line or "use strict" directive.' },
];

function textAfter(done: number): string[] {
  const lines = [...START];
  for (let k = 0; k < done; k++) {
    const e = EDITS[k];
    lines[LINE_OF[k]] = lines[LINE_OF[k]].replace(e.from, e.to);
  }
  return lines;
}

export default function EditSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const lines = textAfter(st.done);
  const code = (st.prelude ? ['class __Vsc_ps { … }', 'function __vsc_bc(c, i, f, w) { … }'] : []).concat(lines).join('\n');
  const hl = st.prelude ? 0 : st.done > 0 ? LINE_OF[st.done - 1] : null;
  return (
    <StepFrame title="Splicing edits, back to front" steps={s} note={st.note}>
      <CodeTrace code={code} line={hl} />
      <Svg w={400} h={118} title="The edit list, sorted by start, last first">
        <T x={6} y={10} size={11} weight={700} fill={tok('muted')}>EDITS (applied top to bottom)</T>
        {EDITS.map((e, k) => {
          const done = k < st.done;
          const now = k === st.done - 1 && !st.prelude;
          return (
            <Box key={e.range} x={4} y={20 + k * 19} w={392} h={17} r={3} fill={now ? tok('brand', 0.15) : done ? tok('safe', 0.08) : tok('panel')} stroke={now ? tok('brand') : tok('line')}>
              <T x={10} y={29 + k * 19} size={11} mono fill={tok('muted')}>{e.range}</T>
              <T x={80} y={29 + k * 19} size={11} mono>{e.from}</T>
              <T x={390} y={29 + k * 19} size={11} anchor="end" fill={done ? tok('safe') : tok('muted')}>{done ? 'applied' : 'waiting'}</T>
            </Box>
          );
        })}
      </Svg>
    </StepFrame>
  );
}
