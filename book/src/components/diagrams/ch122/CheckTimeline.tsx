// The label() program checked two ways: dynamically (Drip runs it and
// meets the bad + only on the call that takes that path) and statically
// (a checker reads every line, taken or not, before anything runs).
import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const CODE = `fn label(n) {
  if n > 99 {
    return "many: " + n;
  }
  return str(n);
}
print label(5);
print label(7);
print label(120);`;

type S = {
  mode: 'dynamic' | 'static';
  line: number | null;
  out: string;
  verdict: 'none' | 'ok' | 'bad';
  status: string;
  note: string;
};

const STATES: S[] = [
  { mode: 'dynamic', line: 6, out: '', verdict: 'none', status: 'running label(5)', note: 'Dynamic checking first: Drip runs the program. The first call is label(5); nothing has been checked yet, because nothing has run yet.' },
  { mode: 'dynamic', line: 4, out: '5', verdict: 'ok', status: 'line 3 skipped', note: '5 > 99 is false, so line 3 is skipped and line 5 returns "5". Line 3 has a mistake in it, but no value has reached it, so nothing complains.' },
  { mode: 'dynamic', line: 7, out: '5 7', verdict: 'ok', status: 'line 3 skipped again', note: 'label(7) takes the same path. Two calls, two correct answers, and the mistake is still invisible: a test suite with only small numbers would pass.' },
  { mode: 'dynamic', line: 2, out: '5 7', verdict: 'bad', status: 'runtime error', note: 'label(120) finally takes the branch. + receives a string and a number, has no rule for them, and the program stops: runtime error: cannot add a string and a number.' },
  { mode: 'static', line: 0, out: '', verdict: 'none', status: 'reading, not running', note: 'Now the static way. Suppose the checker knows n is a number (typed Drip, chapter 124, lets you write n: number). It reads the program from the top; nothing runs, so nothing prints.' },
  { mode: 'static', line: 1, out: '', verdict: 'ok', status: 'n > 99 : bool', note: 'Line 2: n is a number and 99 is a number, so n > 99 is a bool, which is what an if needs. Fine.' },
  { mode: 'static', line: 2, out: '', verdict: 'bad', status: 'error at line 3', note: 'Line 3: "many: " is a string and n is a number, and + has no rule for that pair. The checker reports it now, although no call has ever taken this branch: it checks every path, taken or not.' },
];

export default function CheckTimeline() {
  const s = useSteps(STATES);
  const st = s.state;
  const col = st.verdict === 'bad' ? tok('danger') : st.verdict === 'ok' ? tok('safe') : tok('muted');
  return (
    <StepFrame title="Finding the mistake: while running, or before" steps={s} note={st.note}>
      <Svg w={400} h={58} title={`Mode: ${st.mode}. ${st.status}. Output so far: ${st.out || 'nothing'}.`}>
        <Box x={4} y={6} w={120} h={44} fill={st.mode === 'dynamic' ? tok('brand', 0.12) : tok('accent', 0.12)} stroke={st.mode === 'dynamic' ? tok('brand') : tok('accent')}>
          <T x={64} y={20} size={11} anchor="middle" fill={tok('muted')}>checking</T>
          <T x={64} y={37} size={14} anchor="middle" weight={700}>{st.mode}</T>
        </Box>
        <Box x={132} y={6} w={150} h={44} stroke={col}>
          <T x={207} y={20} size={11} anchor="middle" fill={tok('muted')}>now</T>
          <T x={207} y={37} size={13} anchor="middle" weight={700} fill={col}>{st.status}</T>
        </Box>
        <Box x={290} y={6} w={106} h={44}>
          <T x={343} y={20} size={11} anchor="middle" fill={tok('muted')}>printed</T>
          <T x={343} y={37} size={14} anchor="middle" mono>{st.out || '(nothing)'}</T>
        </Box>
      </Svg>
      <div className="mt-2">
        <CodeTrace code={CODE} line={st.line} />
      </div>
    </StepFrame>
  );
}
