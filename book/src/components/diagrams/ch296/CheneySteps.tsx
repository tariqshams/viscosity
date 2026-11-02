// Chapter 296: Cheney's algorithm on a heap of numbered words. Each object
// is a header word (its number of fields) followed by its fields, which are
// from-space addresses or null. A copied object's header is overwritten
// with 'fwd' and its first field with the new address. The same heap is
// used in the chapter's text and in the exercise's tests.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

type W = number | null | 'fwd';
type S = { from: W[]; to: W[]; scan: number | null; hot?: number; note: string };

const FROM0: W[] = [2, 7, 3, 1, 9, 1, 0, 1, null, 1, 3];
const FROM_OBJ = [
  { n: 'A', at: 0, len: 3 }, { n: 'B', at: 3, len: 2 }, { n: 'G', at: 5, len: 2 },
  { n: 'D', at: 7, len: 2 }, { n: 'E', at: 9, len: 2 },
];
const TO_OBJ = [
  { n: 'A', at: 0, len: 3 }, { n: 'D', at: 3, len: 2 }, { n: 'B', at: 5, len: 2 }, { n: 'E', at: 7, len: 2 },
];
const f = (over: Record<number, W>): W[] => FROM0.map((w, k) => (k in over ? over[k] : w));

const STATES: S[] = [
  { from: FROM0, to: [], scan: null, note: 'From-space is full. Each object is a header (its number of fields) and its fields, which hold addresses. A at 0 points at 7 (D) and 3 (B); B points at E; E points back at B. G points at A, but nothing points at G. The only root is address 0.' },
  { from: f({ 0: 'fwd', 1: 0 }), to: [2, 7, 3], scan: 0, hot: 0, note: 'Copy the root: A\'s three words go to the start of to-space, and its old header becomes the note "fwd, now at 0". The copy\'s fields still say 7 and 3, which are from-space addresses. scan is at A; free is just after it, at 3.' },
  { from: f({ 0: 'fwd', 1: 0, 7: 'fwd', 8: 3 }), to: [2, 3, 3, 1, null], scan: 0, hot: 1, note: 'Scan A\'s first field, 7. D has not been copied, so copy it to free (3), leave a note at 7, and write 3 into the field. free moves to 5.' },
  { from: f({ 0: 'fwd', 1: 0, 7: 'fwd', 8: 3, 3: 'fwd', 4: 5 }), to: [2, 3, 5, 1, null, 1, 9], scan: 3, hot: 2, note: 'A\'s second field, 3, is B: copy it to 5 and rewrite the field. A is finished (black), so scan moves past it to D. Everything between scan and free (D and B) is grey.' },
  { from: f({ 0: 'fwd', 1: 0, 7: 'fwd', 8: 3, 3: 'fwd', 4: 5 }), to: [2, 3, 5, 1, null, 1, 9], scan: 5, hot: 4, note: 'D\'s only field is null: nothing to copy. scan moves on to B.' },
  { from: f({ 0: 'fwd', 1: 0, 7: 'fwd', 8: 3, 3: 'fwd', 4: 5, 9: 'fwd', 10: 7 }), to: [2, 3, 5, 1, null, 1, 7, 1, 3], scan: 7, hot: 6, note: 'B\'s field is 9, E: copy E to 7 and rewrite the field. E\'s own field still says 3, B\'s old address. scan moves to E.' },
  { from: f({ 0: 'fwd', 1: 0, 7: 'fwd', 8: 3, 3: 'fwd', 4: 5, 9: 'fwd', 10: 7 }), to: [2, 3, 5, 1, null, 1, 7, 1, 5], scan: 9, hot: 8, note: 'E\'s field is 3. The header there is now "fwd", so B was copied already: the note says 5, and the field becomes 5 with no second copy. That is how the cycle B and E ends. scan reaches 9, which is free: done.' },
  { from: [], to: [2, 3, 5, 1, null, 1, 7, 1, 5], scan: null, note: 'Swap the spaces. The old from-space, notes, G and all, is now the empty half. G was never touched at all: the cost was the four live objects and nothing else, and they sit packed together, so new objects go at 9.' },
];

const CW = 33;
const show = (w: W) => (w === null ? '∅' : String(w));

function Row({ y, words, objs, label, hot, total }: { y: number; words: W[]; objs: { n: string; at: number; len: number }[]; label: string; hot?: number; total: number }) {
  return (
    <g>
      <T x={8} y={y - 22} size={11} weight={700} fill={tok('muted')}>{label}</T>
      {Array.from({ length: total }, (_, k) => {
        const w = words[k];
        const has = k < words.length;
        const fw = w === 'fwd';
        return (
          <g key={k}>
            <T x={14 + k * CW + CW / 2} y={y - 8} size={11} anchor="middle" fill={tok('muted')}>{k}</T>
            <Box x={14 + k * CW} y={y} w={CW - 3} h={26} r={3}
              fill={!has ? 'transparent' : k === hot ? tok('brand', 0.2) : fw ? tok('warn', 0.2) : tok('panel')}
              stroke={!has ? tok('line', 0.5) : fw ? tok('warn') : tok('ink', 0.4)} dash={!has}>
              {has && <T x={14 + k * CW + (CW - 3) / 2} y={y + 13} size={fw ? 11 : 12} mono anchor="middle">{show(w)}</T>}
            </Box>
          </g>
        );
      })}
      {words.length > 0 && objs.map((o) => (
        <g key={o.n + o.at}>
          <line x1={15 + o.at * CW} x2={11 + (o.at + o.len) * CW} y1={y + 32} y2={y + 32} stroke={tok('ink', 0.5)} strokeWidth={1.5} />
          <T x={13 + (o.at + o.len / 2) * CW} y={y + 42} size={11} weight={700} anchor="middle">{o.n}</T>
        </g>
      ))}
    </g>
  );
}

export default function CheneySteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const free = st.to.length;
  const ptr = (k: number, name: string, color: string, dy: number) => (
    <g>
      <line x1={14 + k * CW} x2={14 + k * CW} y1={178} y2={190 + dy} stroke={color} strokeWidth={2} />
      <T x={17 + k * CW} y={194 + dy} size={11} weight={700} fill={color}>{name}</T>
    </g>
  );
  return (
    <StepFrame title="Cheney's algorithm, word by word" steps={s} note={st.note}>
      <Svg w={400} h={226} title="From-space and to-space as rows of numbered words, with the scan and free pointers moving along to-space">
        <Row y={34} words={st.from} objs={FROM_OBJ} label={st.from.length ? 'FROM-SPACE' : 'FROM-SPACE (now empty)'} total={11} />
        <Row y={128} words={st.to} objs={TO_OBJ.filter((o) => o.at < st.to.length)} label="TO-SPACE" hot={st.hot} total={11} />
        {st.scan !== null && ptr(st.scan, 'scan', tok('brand'), 0)}
        {st.to.length > 0 && ptr(free, 'free', tok('safe'), 16)}
      </Svg>
    </StepFrame>
  );
}
