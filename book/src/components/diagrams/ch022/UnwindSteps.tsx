import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const CODE = `function digit(c) {
  if (c < 48) {
    throw new Error('bad digit');
  }
  return c - 48;
}
function parse(s) {
  return digit(s.charCodeAt(0)) + 1;
}

try {
  console.log(parse('+'));
} catch (e) {
  console.log('caught: ' + e.message);
}`;

type Fr = { label: string; state: 'run' | 'wait' | 'gone' };
type S = { line: number; frames: Fr[]; err: boolean; out?: string; note: string };

const top = (state: Fr['state'], label = 'top-level (inside try)'): Fr => ({ label, state });

const STATES: S[] = [
  { line: 10, frames: [top('run')], err: false, note: 'The top-level code enters a try block. JavaScript notes: “if anything inside here throws, jump to this catch”.' },
  { line: 11, frames: [top('wait'), { label: "parse  s = '+'", state: 'run' }], err: false, note: 'It calls parse(\'+\'). A frame for parse is pushed. The top-level frame waits for its answer.' },
  { line: 7, frames: [top('wait'), { label: "parse  s = '+'", state: 'wait' }, { label: 'digit  c = 43', state: 'run' }], err: false, note: 'parse calls digit with the char code of “+”, which is 43. Another frame is pushed.' },
  { line: 1, frames: [top('wait'), { label: "parse  s = '+'", state: 'wait' }, { label: 'digit  c = 43', state: 'run' }], err: false, note: 'Is 43 < 48? Yes: this is not a digit. digit has no sensible number to return.' },
  { line: 2, frames: [top('wait'), { label: "parse  s = '+'", state: 'wait' }, { label: 'digit  c = 43', state: 'gone' }], err: true, note: 'throw creates an Error object and starts unwinding. digit has no catch, so its frame is popped WITHOUT returning. Line 5 never runs.' },
  { line: 7, frames: [top('wait'), { label: "parse  s = '+'", state: 'gone' }, { label: 'digit  c = 43', state: 'gone' }], err: true, note: 'parse has no catch either. Its frame is popped too, part-way through line 8: the “+ 1” never happens.' },
  { line: 12, frames: [top('run', 'top-level (in catch)'), { label: "parse  s = '+'", state: 'gone' }, { label: 'digit  c = 43', state: 'gone' }], err: true, note: 'The top-level frame has a try. The error lands in its catch, as e. The console.log on line 12 was skipped: its argument never got a value.' },
  { line: 13, frames: [top('run', 'top-level (after catch)')], err: true, out: 'caught: bad digit', note: 'The catch block reads e.message and prints it. Then the program carries on normally after the try/catch.' },
];

export default function UnwindSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const H = 30;
  return (
    <StepFrame title="A thrown error unwinding the stack" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={170} title="The call stack while an error is thrown and caught. Frames without a catch are popped until a try is found.">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>THE CALL STACK</T>
        {st.frames.map((f, k) => {
          const y = 136 - k * (H + 6);
          const gone = f.state === 'gone';
          const run = f.state === 'run';
          return (
            <Box key={k} x={8} y={y} w={232} h={H} dash={gone} opacity={gone ? 0.45 : 1}
              fill={run ? tok('brand', 0.14) : 'transparent'} stroke={gone ? tok('danger') : run ? tok('brand') : tok('ink', 0.4)}>
              <T x={18} y={y + H / 2} size={12.5} mono weight={run ? 700 : 400}>{f.label}</T>
              {gone && <T x={232} y={y + H / 2} size={11} anchor="end" fill={tok('danger')}>popped</T>}
            </Box>
          );
        })}
        {st.err && (
          <Box x={256} y={28} w={136} h={56} r={8} fill={tok('danger', 0.1)} stroke={tok('danger')}>
            <T x={266} y={46} size={11} mono>name: 'Error'</T>
            <T x={266} y={66} size={11} mono>message: 'bad digit'</T>
          </Box>
        )}
        {st.err && <T x={324} y={100} size={11} anchor="middle" fill={tok('muted')}>the thrown Error object</T>}
        {st.out && (
          <g>
            <T x={256} y={130} size={11} fill={tok('muted')}>prints:</T>
            <T x={256} y={150} size={12} mono weight={700} fill={tok('brand')}>{st.out}</T>
          </g>
        )}
      </Svg>
    </StepFrame>
  );
}
