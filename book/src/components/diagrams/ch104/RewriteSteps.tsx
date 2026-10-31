import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// emit.ts in engine/ts/packages/frontend-js: every change is an edit
// {start, end, text} on the ORIGINAL source; edits are applied back to
// front so earlier offsets stay valid. Offsets and replacement texts are
// the real ones for this program (viscosity build).
const SRC = `const ps = [];
for (let i = 0; i < 1000; i++)
  ps.push({ x: i, vx: 1 });
for (let i = 0; i < ps.length; i++)
  ps[i].x += ps[i].vx;
console.log(ps[7].x);`;

const EDITS = [
  { start: 145, end: 152, old: 'ps[7].x', text: "ps.x[__vsc_bc(ps, 7, 'x', false)]", short: 'ps.x[__vsc_bc(…)]' },
  { start: 123, end: 131, old: 'ps[i].vx', text: 'ps.vx[i]', short: 'ps.vx[i]' },
  { start: 112, end: 119, old: 'ps[i].x', text: 'ps.x[i]', short: 'ps.x[i]' },
  { start: 56, end: 71, old: '{ x: i, vx: 1 }', text: 'i, 1', short: 'i, 1' },
  { start: 11, end: 13, old: '[]', text: 'new __Vsc_ps()', short: 'new __Vsc_ps()' },
];

function applied(k: number) {
  let out = SRC;
  for (let j = 0; j < k; j++) {
    const e = EDITS[j];
    out = out.slice(0, e.start) + e.text + out.slice(e.end);
  }
  return out;
}

type S = { done: number; cur: number; line: number | null; prelude: boolean; listed: boolean; note: string };
const STATES: S[] = [
  { done: 0, cur: -1, line: null, prelude: false, listed: false, note: 'The plan says ps is soa. The emitter will not reprint the program from a tree. It records edits, each a range of the original text and a replacement, and copies everything else through unchanged.' },
  { done: 0, cur: -1, line: 4, prelude: false, listed: true, note: 'Five edits: creation, the push argument, and three field accesses. ps[i].x in x += … is both read and written, but it is one range of text, so it gets exactly one edit.' },
  { done: 1, cur: 0, line: 5, prelude: false, listed: true, note: 'Apply them from the end of the file backwards. First 145–152: ps[7] was not proven in bounds, so the index goes through the bounds check __vsc_bc.' },
  { done: 2, cur: 1, line: 4, prelude: false, listed: true, note: '123–131: ps[i].vx becomes ps.vx[i]. The edit we just made, further on, is longer than what it replaced, but that can’t disturb this one: everything before offset 145 is where it was.' },
  { done: 3, cur: 2, line: 4, prelude: false, listed: true, note: '112–119: ps[i].x becomes ps.x[i]. The += stays exactly as written: the column element is a normal assignment target. No bounds check, because the loop condition i < ps.length proves i is in range.' },
  { done: 4, cur: 3, line: 2, prelude: false, listed: true, note: '56–71: the record literal becomes plain arguments in field order, i, 1. The values are copied as source text, so they are still evaluated left to right.' },
  { done: 5, cur: 4, line: 0, prelude: false, listed: true, note: '11–13: the empty array becomes the container. Had we gone front to back, this first edit would have shifted every later offset by 12 characters.' },
  { done: 5, cur: -1, line: null, prelude: true, listed: true, note: 'Last, the prelude goes on top: the container class and the bounds-check helper. Every character not inside an edit, including spacing and comments, is exactly as you wrote it.' },
];

export default function RewriteSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const code = (st.prelude ? '// class __Vsc_ps { … }\n// function __vsc_bc(…) { … }\n' : '') + applied(st.done);
  const line = st.line === null ? null : st.line + (st.prelude ? 2 : 0);
  return (
    <StepFrame title="Rewriting, edit by edit" steps={s} note={st.note}>
      <CodeTrace code={code} line={line} />
      <Svg w={400} h={st.listed ? 186 : 40} title="The list of edits, applied from the last offset to the first">
        <T x={8} y={12} size={10} weight={700} fill={tok('muted')}>RANGE</T>
        <T x={72} y={12} size={10} weight={700} fill={tok('muted')}>ORIGINAL</T>
        <T x={232} y={12} size={10} weight={700} fill={tok('muted')}>REPLACEMENT</T>
        {!st.listed && <T x={8} y={32} size={11} fill={tok('muted')}>(no edits recorded yet)</T>}
        {st.listed && EDITS.map((e, k) => {
          const y = 22 + k * 32;
          const isCur = st.cur === k;
          const isDone = k < st.done;
          return (
            <Box key={k} x={4} y={y} w={392} h={28}
              fill={isCur ? tok('brand', 0.14) : 'transparent'}
              stroke={isCur ? tok('brand') : isDone ? tok('safe') : tok('line')}>
              <T x={10} y={y + 14} size={10} mono>{e.start}–{e.end}</T>
              <T x={72} y={y + 14} size={11} mono>{e.old}</T>
              <T x={232} y={y + 14} size={11} mono fill={isDone ? tok('safe') : tok('muted')}>{e.short}</T>
              {isDone && <T x={388} y={y + 14} size={11} anchor="end" fill={tok('safe')}>✓</T>}
            </Box>
          );
        })}
      </Svg>
    </StepFrame>
  );
}
