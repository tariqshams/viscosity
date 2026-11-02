import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 205: what `?` does in `sub(&one, &t)`, frame by frame. The code
// is the chapter's `sub`, from the operand check in drip-rs's vm.rs
// (pop_numbers), cut down to two value kinds.
const CODE = `fn sub(a: &Value, b: &Value)
    -> Result<f64, String> {
    let x = as_num(a)?;
    let y = as_num(b)?;
    Ok(x - y)
}
// main:  sub(&one, &t)`;

type Frame = { name: string; locals: string };
type S = { line: number | null; frames: Frame[]; value?: string; bad?: boolean; up?: boolean; skipped?: boolean; note: string };

const MAIN: Frame = { name: 'main', locals: 'one = Num(1.0), t = Bool(true)' };
const SUB0: Frame = { name: 'sub', locals: 'a → one, b → t' };
const SUB1: Frame = { name: 'sub', locals: 'a → one, b → t, x = 1.0' };

const STATES: S[] = [
  { line: 6, frames: [MAIN, SUB0], note: 'main calls sub with a number and a boolean. sub gets two borrowed Values and promises a Result<f64, String>.' },
  { line: 2, frames: [MAIN, SUB0, { name: 'as_num', locals: 'v → one' }], value: 'Ok(1.0)', up: true, note: 'as_num(a) sees Value::Num(1.0) and returns Ok(1.0). It hands back a value, like any function.' },
  { line: 2, frames: [MAIN, SUB1], note: 'The ? looks at Ok(1.0), unwraps it, and the expression becomes 1.0. So x is a plain f64, not a Result.' },
  { line: 3, frames: [MAIN, SUB1, { name: 'as_num', locals: 'v → t' }], value: 'Err("Operands must…")', bad: true, up: true, note: 'as_num(b) sees Value::Bool(true), which is not a number, and returns an Err carrying the message.' },
  { line: 3, frames: [MAIN, SUB1], value: 'Err("Operands must…")', bad: true, up: true, skipped: true, note: 'This ? sees an Err, so sub returns that Err right now. Ok(x - y) never runs: y never gets a value.' },
  { line: 6, frames: [MAIN], value: 'Err("Operands must…")', bad: true, note: 'main receives Err(...) as an ordinary return value and must match on it. Nothing was thrown: every frame it crossed chose to pass it on with ?.' },
];

export default function QuestionSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const fh = 44;
  const top = 200 - st.frames.length * (fh + 6);
  return (
    <StepFrame title="What ? does on Ok and on Err" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={210} title="The call stack while sub runs, with the value each call returns">
        <T x={8} y={14} size={11} fill={tok('muted')}>call stack (top is running)</T>
        {[...st.frames].reverse().map((f, k) => {
          const y = top + k * (fh + 6);
          const running = k === 0;
          return (
            <Box key={`${f.name}${k}`} x={8} y={y} w={230} h={fh} fill={running ? tok('brand', 0.12) : tok('panel')} stroke={running ? tok('brand') : tok('line')}>
              <T x={18} y={y + 15} size={12} mono weight={700}>{f.name}</T>
              <T x={18} y={y + 32} size={10} mono fill={tok('muted')}>{f.locals}</T>
            </Box>
          );
        })}
        {st.value && (
          <g>
            <Box x={252} y={top + 6} w={140} h={32} fill={st.bad ? tok('danger', 0.14) : tok('safe', 0.14)} stroke={st.bad ? tok('danger') : tok('safe')}>
              <T x={322} y={top + 22} size={11} mono anchor="middle">{st.value}</T>
            </Box>
            {st.up && <Arrow x1={322} y1={top + 40} x2={322} y2={top + 40 + fh} color={st.bad ? tok('danger') : tok('safe')} />}
          </g>
        )}
        {st.skipped && (
          <T x={252} y={196} size={11} mono fill={tok('muted')}>Ok(x - y): skipped</T>
        )}
      </Svg>
    </StepFrame>
  );
}
