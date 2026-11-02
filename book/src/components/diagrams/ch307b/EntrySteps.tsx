import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Counting with the entry API: entry(f) finds the slot for f,
// or_insert(0) fills it if it is empty, and either way hands back a
// mutable reference to the count, which += 1 changes in place.

const CODE = `let mut n = HashMap::new();
for f in ["x", "vx", "x"] {
    *n.entry(f).or_insert(0) += 1;
}`;

type Row = { k: string; v: number };
type S = { line: number; f?: string; rows: Row[]; hot?: string; fresh?: boolean; note: string };

const STATES: S[] = [
  { line: 0, rows: [], note: 'An empty map. Its key and value types are worked out from how it is used: &str keys, i32 counts.' },
  { line: 2, f: 'x', rows: [{ k: 'x', v: 0 }], hot: 'x', fresh: true, note: 'f = "x". entry("x") finds no slot for x, so or_insert(0) inserts x with the count 0, and hands back a &mut i32 pointing at that 0.' },
  { line: 2, f: 'x', rows: [{ k: 'x', v: 1 }], hot: 'x', note: '*… += 1 follows the reference and adds one, in place in the map: x is now 1. The key was looked up once, not twice.' },
  { line: 2, f: 'vx', rows: [{ k: 'x', v: 1 }, { k: 'vx', v: 1 }], hot: 'vx', fresh: true, note: 'f = "vx": new again, so it is inserted with 0 and at once counted to 1.' },
  { line: 2, f: 'x', rows: [{ k: 'x', v: 2 }, { k: 'vx', v: 1 }], hot: 'x', note: 'f = "x" a second time. This time the slot exists, so or_insert(0) leaves it alone and returns a reference to the existing 1, which becomes 2.' },
  { line: 3, rows: [{ k: 'x', v: 2 }, { k: 'vx', v: 1 }], note: 'Done: x was read twice and vx once. n.get("x") is Some(&2), and n.get("y") is None. (The rows are drawn in insertion order; the real map keeps no order you can rely on.)' },
];

export default function EntrySteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Counting with entry and or_insert" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={130} title="The map's keys and counts, with the entry being updated highlighted">
        <T x={8} y={14} size={11} weight={700} fill={tok('muted')}>f</T>
        <Box x={8} y={26} w={60} h={34} r={4} fill={st.f ? tok('accent', 0.15) : 'transparent'} stroke={st.f ? tok('accent') : tok('line')} dash={!st.f}>
          <T x={38} y={43} size={13} mono weight={700} anchor="middle">{st.f ? `"${st.f}"` : ''}</T>
        </Box>
        <T x={150} y={14} size={11} weight={700} fill={tok('muted')}>MAP n: key → count</T>
        {st.rows.length === 0 && <T x={150} y={43} size={12} fill={tok('muted')}>empty</T>}
        {st.rows.map((r, i) => {
          const y = 26 + i * 44;
          const hot = st.hot === r.k;
          return (
            <g key={r.k}>
              <Box x={150} y={y} w={70} h={34} r={3} fill={tok('f1', 0.12)} stroke={tok('f1')}>
                <T x={185} y={y + 17} size={13} mono anchor="middle">"{r.k}"</T>
              </Box>
              <Box x={226} y={y} w={56} h={34} r={3} fill={hot ? tok('warn', 0.25) : tok('panel')} stroke={hot ? tok('warn') : tok('ink', 0.5)}>
                <T x={254} y={y + 17} size={14} mono weight={700} anchor="middle">{r.v}</T>
              </Box>
              {hot && <Arrow x1={350} y1={y + 17} x2={286} y2={y + 17} color={tok('warn')} />}
              {hot && <T x={354} y={y + 10} size={11} mono fill={tok('warn')}>&amp;mut</T>}
              {hot && st.fresh && <T x={354} y={y + 26} size={11} fill={tok('muted')}>new</T>}
            </g>
          );
        })}
      </Svg>
    </StepFrame>
  );
}
