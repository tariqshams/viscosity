import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 289: applying range edits to a source string, as emit.rs does
// (sort by start, descending, then replace each range). The container
// class name is shortened to P. Offsets and the front-to-back result were
// computed with Node from the three-line source below. Simplified: the real
// emitter splices around each pushed value instead of replacing the whole
// object literal in one edit.
type Ed = { id: string; start: number; end: number; text: string; col: string };
const EDITS: Ed[] = [
  { id: 'E1', start: 11, end: 13, text: 'new P()', col: 'f1' },
  { id: 'E2', start: 23, end: 31, text: '1', col: 'f2' },
  { id: 'E3', start: 39, end: 46, text: 'ps.x[0]', col: 'f3' },
];

type S = { lines: string[]; done: string[]; next?: string; bad?: boolean; order: string; note: string };

const SRC = ['const ps = [];', 'ps.push({ x: 1 });', 's += ps[0].x;'];
const STATES: S[] = [
  { lines: SRC, done: [], order: 'as collected: E1 E2 E3', note: 'The emitter collects edits while it walks the plan: each one says “replace bytes start..end with this text”. All three offsets are positions in the original source.' },
  { lines: ['const ps = new P();', 'ps.1: 1 });', 's += psps.x[0]'], done: ['E1', 'E2', 'E3'], bad: true, order: 'front to back (wrong)', note: 'Apply them front to back and it goes wrong. E1 makes the text 5 bytes longer, so E2’s range 23..31 now covers “push({ x” instead of the object literal, and E3 lands two bytes early.' },
  { lines: SRC, done: [], next: 'E3', order: 'sorted: E3 E2 E1', note: 'So sort by start, last first. An edit only moves the text after it, and every edit still to come lies before it. Their offsets stay true.' },
  { lines: ['const ps = [];', 'ps.push({ x: 1 });', 's += ps.x[0];'], done: ['E3'], next: 'E2', order: 'sorted: E3 E2 E1', note: 'E3 replaces bytes 39..46. Same length here, but it wouldn’t matter: nothing before byte 39 moved.' },
  { lines: ['const ps = [];', 'ps.push(1);', 's += ps.x[0];'], done: ['E3', 'E2'], next: 'E1', order: 'sorted: E3 E2 E1', note: 'E2 shrinks the object literal to its value, 7 bytes shorter. E3 is already done, and E1 sits before it.' },
  { lines: ['const ps = new P();', 'ps.push(1);', 's += ps.x[0];'], done: ['E3', 'E2', 'E1'], order: 'sorted: E3 E2 E1', note: 'E1 last. While applying, the emitter remembers the previous start (39, then 23). An edit whose end runs past it would overlap an applied one, and that is reported as an internal error.' },
];

export default function EditSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Edits, applied back to front" steps={s} note={st.note}>
      <Svg w={400} h={220} title="A three-line source, three range edits, and the text after applying them">
        <T x={8} y={14} size={11} weight={700} fill={tok('brand')}>{st.order}</T>
        {EDITS.map((e, k) => {
          const on = st.next === e.id;
          const done = st.done.includes(e.id);
          return (
            <Box key={e.id} x={8 + k * 130} y={26} w={124} h={44} r={3} fill={on ? tok(e.col, 0.25) : done ? tok(e.col, 0.1) : tok('panel')} stroke={on ? tok(e.col) : tok('line')}>
              <T x={14 + k * 130} y={40} size={10} weight={700} fill={tok(e.col)}>{e.id} {e.start}..{e.end}</T>
              <T x={14 + k * 130} y={58} size={10} mono>→ {e.text}</T>
            </Box>
          );
        })}
        <Box x={8} y={86} w={384} h={92} r={4} fill={st.bad ? tok('danger', 0.08) : tok('panel')} stroke={st.bad ? tok('danger') : tok('line')}>
          {st.lines.map((l, k) => (
            <T key={k} x={18} y={106 + k * 26} size={13} mono>{l}</T>
          ))}
        </Box>
        <T x={8} y={200} size={11} fill={st.bad ? tok('danger') : tok('muted')}>
          {st.bad ? 'garbled: offsets went stale' : `applied: ${st.done.length ? st.done.join(', ') : 'none yet'}`}
        </T>
      </Svg>
    </StepFrame>
  );
}
