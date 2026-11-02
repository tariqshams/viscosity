import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const CODE = `function mul(a: number, b: number) {
  return a * b;
}
let total = mul(2, 3);
let label: string = 'sum';
total = total + 1;
label = total;
mul('3', 4);`;

type Row = { name: string; type: string; how: string };
type S = { line: number | null; rows: Row[]; ok?: string; err?: string; note: string };

const MUL: Row = { name: 'mul', type: '(number, number) → number', how: 'labels + body' };
const TOTAL: Row = { name: 'total', type: 'number', how: 'inferred' };
const LABEL: Row = { name: 'label', type: 'string', how: 'your label' };

const STATES: S[] = [
  { line: 0, rows: [], note: 'The checker reads the file from the top. It runs nothing: no function is called, no number is multiplied. It only keeps a table of names and their types.' },
  { line: 1, rows: [MUL], ok: 'number * number is a number', note: 'Inside mul, a and b are labelled number, so a * b is a number. mul therefore returns a number, and the checker writes that in its table.' },
  { line: 3, rows: [MUL, TOTAL], ok: 'mul(2, 3): both arguments are numbers', note: '2 and 3 are numbers, as mul’s labels require. The call gives a number, so total gets the type number, inferred: you never wrote it. (The checker does not know the value is 6, only that it is some number.)' },
  { line: 4, rows: [MUL, TOTAL, LABEL], ok: '\'sum\' is a string', note: 'label is labelled string, and \'sum\' is a string, so this line agrees with its label.' },
  { line: 5, rows: [MUL, TOTAL, LABEL], ok: 'number + number is a number', note: 'total + 1 is a number, and total holds numbers, so this assignment is fine.' },
  { line: 6, rows: [MUL, TOTAL, LABEL], err: "Type 'number' is not assignable to type 'string'.", note: 'total is a number, but label may only hold strings. The checker reports this line, with the reason, and carries on reading.' },
  { line: 7, rows: [MUL, TOTAL, LABEL], err: "Argument of type 'string' is not assignable|to parameter of type 'number'.", note: '\'3\' is a string, but mul’s parameter a is labelled number. A second report.' },
  { line: null, rows: [MUL, TOTAL, LABEL], err: '2 errors found. Not one line has run.', note: 'Both mistakes were found without running the program. Fix them, run the checker again, and it says nothing at all: that silence is the success message.' },
];

export default function CheckSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="What the checker does with each line" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={150} title="The checker's table of names and types, with the verdict on the current line">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>THE CHECKER’S TABLE</T>
        <T x={8} y={30} size={11} fill={tok('muted')}>name</T>
        <T x={70} y={30} size={11} fill={tok('muted')}>type</T>
        <T x={392} y={30} size={11} anchor="end" fill={tok('muted')}>known from</T>
        <line x1={4} y1={38} x2={396} y2={38} stroke={tok('line')} strokeWidth={1.5} />
        {st.rows.map((r, k) => (
          <g key={r.name}>
            <T x={8} y={52 + k * 20} size={12} mono weight={700}>{r.name}</T>
            <T x={70} y={52 + k * 20} size={12} mono fill={tok('brand')}>{r.type}</T>
            <T x={392} y={52 + k * 20} size={11} anchor="end" fill={tok('muted')}>{r.how}</T>
          </g>
        ))}
        {(st.ok || st.err) && (
          <Box x={4} y={108} w={392} h={38} r={5} stroke={st.err ? tok('danger') : tok('safe')} fill={st.err ? tok('danger', 0.08) : tok('safe', 0.08)}>
            {(st.err ? `✗ ${st.err}` : `✓ ${st.ok}`).split('|').map((ln, k, all) => (
              <T key={k} x={12} y={all.length > 1 ? 119 + k * 15 : 127} size={11.5} fill={st.err ? tok('danger') : tok('safe')}>{ln}</T>
            ))}
          </Box>
        )}
      </Svg>
    </StepFrame>
  );
}
