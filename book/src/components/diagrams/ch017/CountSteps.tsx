import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const CODE = `const cs = ['red', 'blue', 'red'];
const counts = new Map();
for (let i = 0; i < cs.length; i++) {
  const c = cs[i];
  if (counts.has(c)) {
    counts.set(c, counts.get(c) + 1);
  } else {
    counts.set(c, 1);
  }
}`;

type Row = [string, number];
type S = { line: number; i: number | null; rows: Row[]; hot?: string; ask?: string; note: string };

const STATES: S[] = [
  { line: 1, i: null, rows: [], note: 'An empty Map. It will hold one entry per colour: the colour is the key, its count is the value.' },
  { line: 4, i: 0, rows: [], ask: "has('red')? no", note: "i = 0, so c is 'red'. counts.has('red') is false: this colour has not been seen yet." },
  { line: 7, i: 0, rows: [['red', 1]], hot: 'red', note: "So the else branch runs: counts.set('red', 1) adds a new entry, starting the count at 1." },
  { line: 7, i: 1, rows: [['red', 1], ['blue', 1]], hot: 'blue', ask: "has('blue')? no", note: "i = 1, c is 'blue'. Not seen either, so it gets a new entry with count 1." },
  { line: 4, i: 2, rows: [['red', 1], ['blue', 1]], hot: 'red', ask: "has('red')? yes", note: "i = 2, c is 'red' again. This time counts.has('red') is true, so the first branch runs." },
  { line: 5, i: 2, rows: [['red', 2], ['blue', 1]], hot: 'red', ask: "get('red') + 1 = 2", note: "counts.get('red') is 1; set stores 1 + 1 = 2 under the same key. No second 'red' entry is made: setting an existing key replaces its value." },
  { line: 9, i: null, rows: [['red', 2], ['blue', 1]], note: "The loop is done: Map(2) { 'red' => 2, 'blue' => 1 }. The entries are in the order their keys were first added." },
];

const CS = ['red', 'blue', 'red'];

export default function CountSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Counting with a Map" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={176} title="The array cs with the current slot highlighted, and the Map counts as a table of colour and count">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>cs</T>
        {CS.map((c, k) => {
          const x = 8 + k * 74;
          const hot = st.i === k;
          return (
            <g key={k}>
              <Box x={x} y={22} w={68} h={32} fill={hot ? tok('brand', 0.16) : tok('panel')} stroke={hot ? tok('brand') : tok('ink', 0.45)}>
                <T x={x + 34} y={38} size={13} mono anchor="middle">{`'${c}'`}</T>
              </Box>
              <T x={x + 34} y={66} size={11} mono anchor="middle" fill={hot ? tok('brand') : tok('muted')}>{k}</T>
            </g>
          );
        })}
        {st.ask && <T x={392} y={38} size={12} mono weight={700} anchor="end" fill={tok('accent')}>{st.ask}</T>}
        <T x={8} y={88} size={11} weight={700} fill={tok('muted')}>counts (a Map)</T>
        {st.rows.length === 0 && <T x={8} y={114} size={12} fill={tok('muted')}>no entries yet</T>}
        {st.rows.map(([k, v], r) => {
          const y = 98 + r * 36;
          const hot = st.hot === k;
          return (
            <g key={k}>
              <Box x={8} y={y} w={120} h={30} fill={hot ? tok('brand', 0.16) : tok('accent', 0.08)} stroke={hot ? tok('brand') : tok('accent')}>
                <T x={20} y={y + 15} size={13} mono>{`'${k}'`}</T>
              </Box>
              <T x={136} y={y + 15} size={14} fill={tok('muted')}>→</T>
              <Box x={156} y={y} w={60} h={30} fill={tok('panel')} stroke={tok('ink', 0.45)}>
                <T x={186} y={y + 15} size={14} mono anchor="middle">{v}</T>
              </Box>
            </g>
          );
        })}
      </Svg>
    </StepFrame>
  );
}
