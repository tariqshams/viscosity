import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 222: what `?` does with an error of the wrong type. It calls
// From::from to convert the error into the function's own error type
// (The Rust Programming Language, ch. 9.2; std's From docs), then
// returns it. The example is the chapter's min_size function.
const CODE = `fn min_size(path: &Path)
    -> Result<u32, CliError> {
    let s = fs::read_to_string(path)?;
    let n = s.trim().parse::<u32>()?;
    Ok(n)
}`;

type Src = 'io' | 'num' | null;
type S = { line: number | null; src: Src; from: boolean; out: boolean; note: string };

const STATES: S[] = [
  { line: 1, src: null, from: false, out: false, note: 'min_size promises one error type, CliError, an enum with one variant per thing that can go wrong.' },
  { line: 2, src: 'io', from: false, out: false, note: 'The file is missing: read_to_string returns Err(io::Error). But this function returns CliError, not io::Error.' },
  { line: 2, src: 'io', from: true, out: false, note: '? doesn’t give up. It calls From::from(e), and the compiler picks impl From<io::Error> for CliError, which wraps it as CliError::Io(e).' },
  { line: 2, src: 'io', from: true, out: true, note: 'Then ? returns Err(CliError::Io(e)) from min_size at once. The parse on the next line never runs.' },
  { line: 3, src: 'num', from: true, out: true, note: 'If the file says “lots”, parse fails with a ParseIntError. Same ?, different impl: From<ParseIntError> makes CliError::Num(e).' },
  { line: null, src: null, from: false, out: true, note: 'The caller gets one type and matches on its variants: a message, an exit code, a retry. Delete an impl and that ? stops compiling (E0277).' },
];

export default function FromSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const col = st.src === 'num' ? 'f2' : 'f3';
  return (
    <StepFrame title="? converts, then returns" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={200} title="Two error types converted into one enum by From">
        {(['io', 'num'] as const).map((k, j) => {
          const on = st.src === k;
          const c = k === 'io' ? 'f3' : 'f2';
          return (
            <Box key={k} x={8} y={20 + j * 70} w={118} h={40} r={3} fill={on ? tok(c, 0.18) : tok('panel')} stroke={on ? tok(c) : tok('line')}>
              <T x={67} y={40 + j * 70} size={11} mono anchor="middle">{k === 'io' ? 'io::Error' : 'ParseIntError'}</T>
            </Box>
          );
        })}
        <Box x={146} y={55} w={76} h={40} r={3} fill={st.from ? tok('brand', 0.15) : tok('panel')} stroke={st.from ? tok('brand') : tok('line')}>
          <T x={184} y={75} size={11} mono anchor="middle">From</T>
        </Box>
        {st.src && st.from && (
          <Arrow x1={126} y1={st.src === 'io' ? 40 : 110} x2={146} y2={75} color={tok(col)} />
        )}
        <T x={244} y={14} size={11} weight={700} fill={tok('brand')}>enum CliError</T>
        {(['Io', 'Num'] as const).map((v, j) => {
          const on = st.from && ((v === 'Io' && st.src === 'io') || (v === 'Num' && st.src === 'num'));
          const c = v === 'Io' ? 'f3' : 'f2';
          return (
            <Box key={v} x={244} y={26 + j * 52} w={148} h={40} r={3} fill={on ? tok(c, 0.18) : tok('panel')} stroke={on ? tok(c) : tok('line')}>
              <T x={318} y={46 + j * 52} size={11} mono anchor="middle">{v === 'Io' ? 'Io(io::Error)' : 'Num(ParseIntError)'}</T>
            </Box>
          );
        })}
        {st.src && st.from && (
          <Arrow x1={222} y1={75} x2={244} y2={st.src === 'io' ? 46 : 98} color={tok(col)} />
        )}
        {st.out && (
          <g>
            <Box x={244} y={140} w={148} h={36} r={3} fill={tok('danger', 0.1)} stroke={tok('danger')}>
              <T x={318} y={158} size={11} mono anchor="middle">return Err(…)</T>
            </Box>
            {st.src === 'io'
              ? <Arrow x1={244} y1={56} x2={244} y2={150} bend={0.6} color={tok('danger')} />
              : <Arrow x1={318} y1={118} x2={318} y2={140} color={tok('danger')} />}
          </g>
        )}
      </Svg>
    </StepFrame>
  );
}
