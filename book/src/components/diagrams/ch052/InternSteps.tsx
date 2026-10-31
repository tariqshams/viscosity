import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// The companion VM's string table after compiling this program (checked
// by running it): each distinct string exists exactly once.
const CODE = `let a = "hi";
let b = "h" + "i";
let c = a;
print a == b;`;

const STRS = ['init', 'clock', 'a', 'hi', 'b', 'h', 'i', 'c'];
const HI = STRS.indexOf('hi');

type S = { line: number | null; vars: ('a' | 'b' | 'c')[]; probe?: boolean; eq?: boolean; note: string };

const STATES: S[] = [
  { line: null, vars: [], note: 'After compiling, the string table holds eight strings: two the VM made at start-up, the names a, b and c, and the literals "hi", "h" and "i". Every one went through copyString, so each exists once.' },
  { line: 0, vars: ['a'], note: 'let a = "hi" pushes the "hi" constant and stores it in the global a. Nothing new is made: a refers to the one "hi".' },
  { line: 1, vars: ['a'], probe: true, note: 'OP_ADD joins the characters into "hi" and calls copyString. It hashes "hi" and asks the table: is there already a string with this hash and these characters? Yes, so no new object is allocated.' },
  { line: 1, vars: ['a', 'b'], note: 'copyString returns the existing "hi". So b refers to exactly the same object as a, although one came from a literal and the other was built at runtime.' },
  { line: 2, vars: ['a', 'b', 'c'], note: 'let c = a copies the reference. Three names, one string object.' },
  { line: 3, vars: ['a', 'b', 'c'], eq: true, note: 'a == b runs OP_EQUAL, which is just ===. Same object, so true, without looking at a single character. Equal strings are always the same object here, so identity is the same as equality.' },
];

export default function InternSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const rowY = (k: number) => 30 + k * 26;
  const vy = { a: 70, b: 120, c: 170 } as const;
  return (
    <StepFrame title="Many references, one string" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={250} title="Global variables on the left, the VM's string table on the right; the variables all point at the single hi object">
        <T x={10} y={12} size={11} weight={700} fill={tok('muted')}>GLOBALS</T>
        <T x={236} y={12} size={11} weight={700} fill={tok('muted')}>STRING TABLE</T>
        {STRS.map((c, k) => (
          <Box key={c} x={236} y={rowY(k)} w={150} h={22} r={4} fill={tok('brand', k === HI ? 0.25 : 0.06)} stroke={k === HI ? tok('brand') : tok('line')}>
            <T x={248} y={rowY(k) + 11} size={13} mono weight={k === HI ? 700 : 400}>"{c}"</T>
          </Box>
        ))}
        {st.vars.map((v) => (
          <g key={v}>
            <Box x={10} y={vy[v] - 15} w={50} h={30} r={4} stroke={st.eq && v !== 'c' ? tok('safe') : tok('ink', 0.5)}>
              <T x={35} y={vy[v]} size={15} mono weight={700} anchor="middle">{v}</T>
            </Box>
            <Arrow x1={60} y1={vy[v]} x2={233} y2={rowY(HI) + 11} bend={v === 'a' ? 0 : v === 'b' ? 0.15 : 0.3} />
          </g>
        ))}
        {st.probe && (
          <g>
            <Box x={80} y={196} w={140} h={44} r={6} dash fill={tok('warn', 0.1)} stroke={tok('warn')}>
              <T x={90} y={210} size={11} fill={tok('muted')}>joined chars</T>
              <T x={90} y={228} size={13} mono>"hi" → found</T>
            </Box>
            <Arrow x1={220} y1={210} x2={233} y2={rowY(HI) + 16} dash />
          </g>
        )}
        {st.eq && <T x={10} y={236} size={14} mono fill={tok('safe')}>a === b → true</T>}
      </Svg>
    </StepFrame>
  );
}
