import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 428: how bounds_loops_and_sizes in
// engine/rust/crates/core/src/analysis.rs files field accesses into one
// LoopAccess per loop. The visit order and the final tables are the real
// ones: a Debug dump of Collection::loops and Collection::accesses for this
// program (rustc 1.97 release build) gave the accesses in the order
// y (line 11), x (line 10), vy, y, y written (line 6), vx, x, x written
// (line 5), and these three tables.
const CODE = `const ps = [];
for (let i = 0; i < 500; i++)
  ps.push({ x: i, y: 0, vx: 1, vy: 2 });
for (let i = 0; i < ps.length; i++) {
  ps[i].x += ps[i].vx;
  ps[i].y += ps[i].vy;
}
let s = 0;
for (let i = 1; i < ps.length; i++)
  s += ps[i - 1].x;
console.log(s, ps[0].y);`;

type Table = { key: string; line: number; depth: number; reads: string[]; writes: string[] };
type S = { line: number | null; visit?: string; tables: Table[]; sorted?: boolean; note: string };

const T11: Table = { key: '(main, None)', line: 11, depth: 0, reads: ['y'], writes: [] };
const T9: Table = { key: '(main, Some(h9))', line: 9, depth: 1, reads: ['x'], writes: [] };
const t4 = (reads: string[], writes: string[]): Table => ({ key: '(main, Some(h4))', line: 4, depth: 1, reads, writes });

const STATES: S[] = [
  { line: null, tables: [], note: 'Eight field accesses on elements of ps. The pass visits them in the order an earlier pass found them, which is last load first, and files each one under the loop it sits in.' },
  { line: 10, visit: 'read .y (line 11)', tables: [T11], note: 'First visited: ps[0].y on line 11, outside every loop. loop_of returns None, so the key is (main, None): a table with depth 0 and trips Some(1.0).' },
  { line: 9, visit: 'read .x (line 10)', tables: [T11, T9], note: 'Next, ps[i - 1].x. Its innermost loop is the one whose header is on line 9, so the key is (main, Some(header)). New key, so or_insert_with builds a fresh table.' },
  { line: 5, visit: 'read .vy (line 6)', tables: [T11, T9, t4(['vy'], [])], note: 'Line 6 is visited before line 5. vy is read first, into a third table for the loop on line 4.' },
  { line: 5, visit: 'read .y, write .y', tables: [T11, T9, t4(['vy', 'y'], ['y'])], note: 'Same key, so the same table. y += reads y and then writes it: one entry in reads, one in writes. An IndexSet keeps each field once, in first-seen order.' },
  { line: 4, visit: 'read .vx, read .x, write .x', tables: [T11, T9, t4(['vy', 'y', 'vx', 'x'], ['y', 'x'])], note: 'Line 5 adds vx and x to reads and x to writes. All eight accesses are filed.' },
  { line: null, tables: [t4(['vy', 'y', 'vx', 'x'], ['y', 'x']), T9, T11], sorted: true, note: 'sort_by_key by line (stable). explain prints only depth > 0, and lists reads then writes without repeats: line 4 touches 4 of 4 fields (vy, y, vx, x); line 9 touches 1 (x).' },
];

export default function TableSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Filing accesses into loop tables" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={150} title="The LoopAccess tables built so far, one per key">
        <T x={6} y={12} size={11} weight={700} fill={tok('muted')}>
          {st.visit ? `VISITING: ${st.visit}` : st.sorted ? 'SORTED BY LINE' : 'TABLES (none yet)'}
        </T>
        {st.tables.map((t, k) => {
          const x = 4 + k * 132;
          const shown = !st.sorted || t.depth > 0;
          return (
            <Box key={t.key} x={x} y={24} w={128} h={120} fill={shown ? tok('brand', 0.07) : 'transparent'} stroke={shown ? tok('brand') : tok('line')} dash={!shown}>
              <T x={x + 6} y={38} size={11} mono weight={700}>{t.key}</T>
              <T x={x + 6} y={56} size={11} mono>line {t.line}, depth {t.depth}</T>
              <T x={x + 6} y={76} size={11} fill={tok('muted')}>reads</T>
              <T x={x + 6} y={92} size={11} mono fill={tok('f1')}>{t.reads.join(' ') || '{}'}</T>
              <T x={x + 6} y={112} size={11} fill={tok('muted')}>writes</T>
              <T x={x + 6} y={128} size={11} mono fill={tok('f3')}>{t.writes.join(' ') || '{}'}</T>
            </Box>
          );
        })}
      </Svg>
    </StepFrame>
  );
}
