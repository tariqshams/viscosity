import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// Collecting a collection's access table: each field read or write of an
// element is filed under the innermost loop around it. The rows are the
// real LoopAccess records Viscosity computes for this program.
const CODE = `const ps = [];
for (let i = 0; i < 1000; i++)
  ps.push({ x: i, y: 0, vx: 1, vy: 2 });
for (let t = 0; t < 60; t++) {
  for (let i = 0; i < ps.length; i++) {
    ps[i].x += ps[i].vx;
    ps[i].y += ps[i].vy;
  }
}
let s = 0;
for (let i = 0; i < 10; i++) s += ps[i].x;
console.log(s, ps[0].y);`;

type Row = { loop: string; depth: number; trips: string; r: string[]; w: string[] };
type S = { line: number | null; rows: Row[]; hl?: number; explain?: boolean; note: string };

const STATES: S[] = [
  { line: null, rows: [], note: 'The safety pass has already listed every element access: each field read (field.get) and write (field.set) on an element of ps. Now Viscosity sorts them by loop.' },
  { line: 5, rows: [{ loop: 'line 5', depth: 2, trips: '?', r: ['x', 'vx'], w: ['x'] }], hl: 0, note: 'ps[i].x += ps[i].vx reads x and vx, and writes x. The innermost natural loop around this line has its header on line 5, so a row is made for it. Two loops enclose it, so its depth is 2.' },
  { line: 6, rows: [{ loop: 'line 5', depth: 2, trips: '?', r: ['x', 'vx', 'y', 'vy'], w: ['x', 'y'] }], hl: 0, note: 'Same loop, same row. y and vy join the reads, y joins the writes. The row holds sets, so reading x twice doesn’t matter.' },
  { line: 4, rows: [{ loop: 'line 5', depth: 2, trips: '?', r: ['x', 'vx', 'y', 'vy'], w: ['x', 'y'] }], hl: 0, note: 'Trips: Viscosity only counts loops shaped like i < constant, with i starting at 0 and stepping by 1. This one runs to ps.length, so its trip count is unknown. The outer loop’s 60 is not part of this row.' },
  { line: 10, rows: [{ loop: 'line 5', depth: 2, trips: '?', r: ['x', 'vx', 'y', 'vy'], w: ['x', 'y'] }, { loop: 'line 11', depth: 1, trips: '10', r: ['x'], w: [] }], hl: 1, note: 'A new loop, a new row. It only reads x. Its condition is i < 10 with i counting from 0, so the trip count is known: 10.' },
  { line: 11, rows: [{ loop: 'line 5', depth: 2, trips: '?', r: ['x', 'vx', 'y', 'vy'], w: ['x', 'y'] }, { loop: 'line 11', depth: 1, trips: '10', r: ['x'], w: [] }, { loop: 'none', depth: 0, trips: '1', r: ['y'], w: [] }], hl: 2, note: 'ps[0].y is in no loop at all. It still gets a row, with depth 0 and a single trip, so nothing is lost. But it runs once: it is not a reason to change the layout.' },
  { line: null, explain: true, rows: [{ loop: 'line 5', depth: 2, trips: '?', r: ['x', 'vx', 'y', 'vy'], w: ['x', 'y'] }, { loop: 'line 11', depth: 1, trips: '10', r: ['x'], w: [] }, { loop: 'none', depth: 0, trips: '1', r: ['y'], w: [] }], note: 'explain reports only rows with depth above 0, each as “touches k of F fields”, where k counts reads and writes together. The depth-0 row is dropped.' },
];

const COL: Record<string, string> = { x: tok('f1'), y: tok('f2'), vx: tok('f3'), vy: tok('f4') };
const X = { loop: 8, depth: 92, trips: 140, r: 186, w: 300 };

function Fields({ fs, x, y }: { fs: string[]; x: number; y: number }) {
  let cx = x;
  return (
    <g>
      {fs.length === 0 && <T x={x} y={y} size={12} fill={tok('muted')}>none</T>}
      {fs.map((f) => {
        const el = <T key={f} x={cx} y={y} size={12} mono weight={700} fill={COL[f]}>{f}</T>;
        cx += f.length * 8 + 8;
        return el;
      })}
    </g>
  );
}

export default function AccessSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Building the access table" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={200} title="One row per loop: depth, trip count, fields read, fields written">
        {(['loop', 'depth', 'trips', 'r', 'w'] as const).map((k) => (
          <T key={k} x={X[k]} y={12} size={11} weight={700} fill={tok('muted')}>
            {k === 'r' ? 'READS' : k === 'w' ? 'WRITES' : k.toUpperCase()}
          </T>
        ))}
        {st.rows.length === 0 && <T x={8} y={44} size={12} fill={tok('muted')}>no rows yet</T>}
        {st.rows.map((r, k) => {
          const y = 26 + k * 40;
          const dropped = st.explain && r.depth === 0;
          return (
            <Box key={k} x={2} y={y} w={396} h={32} opacity={dropped ? 0.35 : 1}
              fill={st.hl === k ? tok('brand', 0.12) : tok('panel')} stroke={st.hl === k ? tok('brand') : tok('line')} dash={dropped}>
              <T x={X.loop + 4} y={y + 16} size={12} mono>{r.loop}</T>
              <T x={X.depth + 12} y={y + 16} size={12} mono>{r.depth}</T>
              <T x={X.trips + 12} y={y + 16} size={12} mono>{r.trips}</T>
              <Fields fs={r.r} x={X.r} y={y + 16} />
              <Fields fs={r.w} x={X.w} y={y + 16} />
            </Box>
          );
        })}
        {st.explain && (
          <g>
            <T x={8} y={160} size={11} mono>loop at line 5 … touches 4 of 4 fields</T>
            <T x={8} y={180} size={11} mono>loop at line 11 … touches 1 of 4 fields</T>
          </g>
        )}
      </Svg>
    </StepFrame>
  );
}
