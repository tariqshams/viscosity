import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const V1 = `type Light = 'red' | 'amber' | 'green';`;
const V2 = `type Light = 'red' | 'amber' | 'green'
  | 'flashing';`;
const SIG = `
function next(l: Light): Light {`;
const BODY = `
  if (l === 'red') return 'green';
  if (l === 'green') return 'amber';
  if (l === 'amber') return 'red';
  return unreachable(l);`;
const FLASH = `
  if (l === 'flashing') return 'red';`;

type S = { code: string; line: number | null; checker: string; ok: boolean; note: string };

const STATES: S[] = [
  { code: V1, line: 0, checker: 'no errors', ok: true, note: 'Step 1: the data. Before any code, write down what a light can be: exactly three colours. This one line is the whole design of the data.' },
  { code: V1 + SIG + '\n}', line: 2, checker: 'TS2355: must return a value', ok: false, note: 'Step 2: the signature. next takes a Light and gives back a Light. With no body yet the checker already objects: a function that promises a Light has to return one.' },
  { code: V1 + SIG + BODY + '\n}', line: null, checker: 'no errors', ok: true, note: 'Step 3: the body follows the type. Three colours means three branches, and unreachable(l) at the end makes the checker prove that none is missing.' },
  { code: V2 + SIG + BODY + '\n}', line: 7, checker: `TS2345: '"flashing"' is not assignable to 'never'`, ok: false, note: 'Step 4: a change. A new requirement adds flashing, and we change the type first. The checker now points at the one line that has not caught up: l can still be flashing there.' },
  { code: V2 + SIG + FLASH + BODY + '\n}', line: 4, checker: 'no errors', ok: true, note: 'Step 5: follow the error and add the branch. Nothing is left for l to be on the last line, so the checker is satisfied. The type changed first, and the code followed.' },
];

export default function DesignSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const c = st.ok ? 'safe' : 'danger';
  return (
    <StepFrame title="Designing a traffic light, types first" steps={s} note={st.note}>
      <CodeTrace code={st.code} line={st.line} />
      <Svg w={400} h={44} title={`What tsc reports now: ${st.checker}`}>
        <Box x={2} y={6} w={396} h={32} fill={tok(c, 0.1)} stroke={tok(c)}>
          <T x={12} y={22} size={11} weight={700} fill={tok(c)}>tsc</T>
          <T x={40} y={22} size={11} mono>{st.checker}</T>
        </Box>
      </Svg>
    </StepFrame>
  );
}
