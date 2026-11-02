import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 310: matching my_vec![1, 2, 3] against ($($x:expr),* $(,)?)
// and transcribing $( v.push($x); )*, per the Rust Reference's
// "Macros By Example" (rules tried in order; repetitions bind one
// fragment per match; the transcriber repeats once per match). The
// expansion shown is what rustc +nightly -Zunpretty=expanded printed.
const CODE = `($($x:expr),* $(,)?) => {{
    let mut v = Vec::new();
    $( v.push($x); )*
    v
}};`;

const TOKS = ['1', ',', '2', ',', '3'];
type S = { line: number; at: number | null; xs: string[]; out: string[]; note: string };

const STATES: S[] = [
  { line: 0, at: null, xs: [], out: [], note: 'The call hands the macro five tokens: 1 , 2 , 3. The matcher wants zero or more expressions separated by commas, then an optional comma.' },
  { line: 0, at: 0, xs: ['1'], out: [], note: 'The first repetition: $x:expr matches the expression 1. The binding list for $x is now [1].' },
  { line: 0, at: 2, xs: ['1', '2'], out: [], note: 'A comma separator, so the repetition goes round again: $x matches 2.' },
  { line: 0, at: 4, xs: ['1', '2', '3'], out: [], note: 'Another comma, another expression: 3. No tokens are left, so the optional trailing comma matches zero times, and the rule matches.' },
  { line: 1, at: null, xs: ['1', '2', '3'], out: ['let mut v = Vec::new();'], note: 'Now the transcriber writes the output. Lines with no $ are copied as they are.' },
  { line: 2, at: null, xs: ['1', '2', '3'], out: ['let mut v = Vec::new();', 'v.push(1);', 'v.push(2);', 'v.push(3);'], note: '$( v.push($x); )* repeats once per binding of $x: three matches, three push lines, in order.' },
  { line: 3, at: null, xs: ['1', '2', '3'], out: ['let mut v = Vec::new();', 'v.push(1);', 'v.push(2);', 'v.push(3);', 'v'], note: 'The block ends with v, so the whole call is one expression whose value is the vector. This block replaces my_vec![1, 2, 3] before type checking.' },
];

export default function MatchSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Matching and expanding my_vec![1, 2, 3]" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={200} title="The call's tokens, the bindings for $x, and the expansion being written">
        <T x={8} y={14} size={11} weight={700} fill={tok('muted')}>input tokens</T>
        {TOKS.map((t, k) => {
          const hit = st.at === k;
          const done = st.at !== null ? k <= st.at : st.xs.length === 3;
          return (
            <Box key={k} x={8 + k * 46} y={24} w={40} h={30} r={4}
              fill={hit ? tok('brand', 0.2) : done ? tok('safe', 0.1) : tok('panel')}
              stroke={hit ? tok('brand') : tok('line')}>
              <T x={28 + k * 46} y={39} size={13} mono anchor="middle">{t}</T>
            </Box>
          );
        })}
        <T x={250} y={39} size={11} mono fill={tok('f1')}>$x = [{st.xs.join(', ')}]</T>
        <Box x={8} y={68} w={384} h={126} fill={tok('panel')} stroke={tok('line')} dash>
          <T x={16} y={82} size={11} fill={tok('muted')}>expansion</T>
          <T x={16} y={100} size={11} mono>{st.out.length ? '{' : ''}</T>
          {st.out.map((l, k) => (
            <T key={k} x={30} y={116 + k * 15} size={11} mono>{l}</T>
          ))}
        </Box>
      </Svg>
    </StepFrame>
  );
}
