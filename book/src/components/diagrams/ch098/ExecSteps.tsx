import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const CODE = `let x = 2;
let y;
print x;
x = x * 10;
print x + 1;
print y;
print z;`;

type S = { line: number; globals: [string, string][]; changed?: string; out: string[]; err?: boolean; note: string };

const STATES: S[] = [
  { line: 0, globals: [['x', '2']], changed: 'x', out: [], note: 'The program is a list of seven statements, run one after another. The first is a let: evaluate the initializer 2, then define x in the table of globals.' },
  { line: 1, globals: [['x', '2'], ['y', 'nil']], changed: 'y', out: [], note: 'let y; has no initializer, so y starts as nil.' },
  { line: 2, globals: [['x', '2'], ['y', 'nil']], out: ['2'], note: 'print x: evaluating the name x looks it up in the table and finds 2. The table does not change. The effect of this statement is a line of output.' },
  { line: 3, globals: [['x', '20'], ['y', 'nil']], changed: 'x', out: ['2'], note: 'An expression statement holding an assignment. x * 10 is 20, and the assignment overwrites x. The statement then throws the value 20 away: only the change matters.' },
  { line: 4, globals: [['x', '20'], ['y', 'nil']], out: ['2', '21'], note: 'print x + 1 sees the new x. Later statements observe what earlier ones did: that is what “state” means.' },
  { line: 5, globals: [['x', '20'], ['y', 'nil']], out: ['2', '21', 'nil'], note: 'print y prints nil.' },
  { line: 6, globals: [['x', '20'], ['y', 'nil']], out: ['2', '21', 'nil'], err: true, note: 'print z looks z up, and the table has no z. Undefined variable \'z\'. This is a runtime error: the loop over the statements stops. The three lines already printed stay printed. Exit code 70.' },
];

export default function ExecSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Running a program, one statement at a time" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={150} title="The table of global variables and the output, as each statement of the program runs.">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>GLOBALS</T>
        {st.globals.map(([k, v], i) => {
          const y = 26 + i * 32;
          const ch = st.changed === k;
          return (
            <Box key={k} x={8} y={y} w={170} h={26} fill={ch ? tok('brand', 0.14) : 'transparent'} stroke={ch ? tok('brand') : tok('ink', 0.4)}>
              <T x={20} y={y + 13} size={14} mono weight={700} fill={tok('f1')}>{k}</T>
              <line x1={56} y1={y + 3} x2={56} y2={y + 23} stroke={tok('line')} />
              <T x={68} y={y + 13} size={14} mono weight={ch ? 700 : 400}>{v}</T>
              {ch && <T x={170} y={y + 13} size={10} anchor="end" fill={tok('brand')}>changed</T>}
            </Box>
          );
        })}
        <T x={200} y={12} size={11} weight={700} fill={tok('muted')}>OUTPUT</T>
        <Box x={200} y={22} w={192} h={120} fill={tok('paper')} stroke={tok('ink', 0.3)}>
          {st.out.map((l, i) => (
            <T key={i} x={212} y={38 + i * 18} size={13} mono>{l}</T>
          ))}
          {st.err && (
            <g>
              <T x={212} y={38 + st.out.length * 18} size={11.5} mono fill={tok('danger')}>Undefined variable &apos;z&apos;.</T>
              <T x={212} y={56 + st.out.length * 18} size={11.5} mono fill={tok('danger')}>[line 7]</T>
            </g>
          )}
        </Box>
      </Svg>
    </StepFrame>
  );
}
