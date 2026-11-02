import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// The companion VM's string table (heap.strings) for this program, checked
// by running it: nine strings, each exactly once, in the order made.
const CODE = `let a = "ab";
let b = "a" + "b";
print a == b;`;

const STRS = ['init', 'clock', 'len', 'push', 'pop', 'str', 'ab', 'a', 'b'];
const AB = STRS.indexOf('ab');

type S = { line: number | null; vars: ('a' | 'b')[]; probe?: boolean; eq?: boolean; ops: string; note: string };

const STATES: S[] = [
  { line: null, vars: [], ops: 'after compiling', note: 'Before anything runs, the string table holds nine strings. The VM made six at start-up (init and the five native names); the compiler made "ab", "a" and "b". The name of the variable a and the literal "a" are one object: copyString found the first when asked for the second.' },
  { line: 0, vars: ['a'], ops: 'const 0 · define.global 1', note: 'const pushes the "ab" constant, and define.global stores it under the name "a". Nothing new is made: the global a refers to the one "ab".' },
  { line: 1, vars: ['a'], probe: true, ops: 'const 2 · const 3 · add', note: 'add joins the characters of "a" and "b" into the JavaScript string "ab" and calls copyString. It hashes "ab" and asks the table: is there a string with this hash and these characters? There is, so nothing is allocated.' },
  { line: 1, vars: ['a', 'b'], ops: 'define.global 4', note: 'copyString returned the existing "ab", so b refers to exactly the same object as a, although one came from a literal and the other was built while the program ran.' },
  { line: 2, vars: ['a', 'b'], eq: true, ops: 'load.global ×2 · eq', note: 'eq compares with ===. Same object, so true, without reading a single character. Equal strings are always the same object here, so identity and equality agree.' },
];

export default function InternSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const rowY = (k: number) => 28 + k * 24;
  const vy = { a: 80, b: 150 } as const;
  return (
    <StepFrame title="Many references, one string" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={256} title="Global variables on the left, the VM's string table on the right; both variables point at the single ab object">
        <T x={10} y={12} size={11} weight={700} fill={tok('muted')}>GLOBALS</T>
        <T x={246} y={12} size={11} weight={700} fill={tok('muted')}>STRING TABLE</T>
        <T x={10} y={40} size={11} mono fill={tok('muted')}>{st.ops}</T>
        {STRS.map((c, k) => (
          <Box key={c} x={246} y={rowY(k)} w={144} h={20} r={4} fill={tok('brand', k === AB ? 0.25 : 0.06)} stroke={k === AB ? tok('brand') : tok('line')}>
            <T x={258} y={rowY(k) + 10} size={12} mono weight={k === AB ? 700 : 400}>"{c}"</T>
          </Box>
        ))}
        {st.vars.map((v) => (
          <g key={v}>
            <Box x={10} y={vy[v] - 15} w={50} h={30} r={4} stroke={st.eq ? tok('safe') : tok('ink', 0.5)}>
              <T x={35} y={vy[v]} size={15} mono weight={700} anchor="middle">{v}</T>
            </Box>
            <Arrow x1={60} y1={vy[v]} x2={243} y2={rowY(AB) + 10} bend={v === 'a' ? 0 : 0.2} />
          </g>
        ))}
        {st.probe && (
          <g>
            <Box x={70} y={190} w={150} h={44} r={6} dash fill={tok('warn', 0.1)} stroke={tok('warn')}>
              <T x={80} y={204} size={11} fill={tok('muted')}>joined characters</T>
              <T x={80} y={222} size={13} mono>"ab" → found</T>
            </Box>
            <Arrow x1={220} y1={206} x2={243} y2={rowY(AB) + 14} dash />
          </g>
        )}
        {st.eq && <T x={10} y={240} size={14} mono fill={tok('safe')}>a === b → true</T>}
      </Svg>
    </StepFrame>
  );
}
