import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const CODE = `let n = 0;
while n < 5 {
  n += 1;
  if n == 2 { continue; }
  if n == 4 { break; }
  print n;
}
print "done";`;

type C = 'NORMAL' | 'CONTINUE' | 'BREAK';
type S = {
  line: number;
  n: number;
  /** what is running, outermost first */
  running: string[];
  /** a completion value climbing out, and how far it has got */
  comp?: C;
  out: string[];
  note: string;
};

const STATES: S[] = [
  { line: 0, n: 0, running: [], out: [], note: 'let defines n as 0 in the globals.' },
  { line: 1, n: 0, running: ['while'], out: [], note: 'The while evaluates its condition: 0 < 5 is true, so it runs the body in a fresh environment.' },
  { line: 2, n: 1, running: ['while', 'body'], out: [], note: 'n += 1 makes n 1. An expression statement finishes with NORMAL, so the body’s list carries on.' },
  { line: 3, n: 1, running: ['while', 'body'], out: [], note: 'n == 2 is false, so the if runs no branch and finishes NORMAL. The same happens for n == 4.' },
  { line: 5, n: 1, running: ['while', 'body'], out: ['1'], comp: 'NORMAL', note: 'print 1. The last statement finished, so the whole body returns NORMAL to the loop, which goes round again.' },
  { line: 2, n: 2, running: ['while', 'body'], out: ['1'], note: '1 < 5, so round again: n becomes 2.' },
  { line: 3, n: 2, running: ['while', 'body', 'if block'], out: ['1'], comp: 'CONTINUE', note: 'n == 2 is true. Inside the if’s block, continue does nothing but return CONTINUE. The if’s block stops and passes it up.' },
  { line: 3, n: 2, running: ['while', 'body'], out: ['1'], comp: 'CONTINUE', note: 'The body’s list sees CONTINUE, not NORMAL, so it stops at once: lines 4 and 5 are skipped. It passes CONTINUE to the loop.' },
  { line: 1, n: 2, running: ['while'], out: ['1'], note: 'For CONTINUE the loop needs no special code: it simply tests the condition again. 2 < 5.' },
  { line: 5, n: 3, running: ['while', 'body'], out: ['1', '3'], comp: 'NORMAL', note: 'n becomes 3, both ifs are false, and print 3 runs. NORMAL again.' },
  { line: 4, n: 4, running: ['while', 'body', 'if block'], out: ['1', '3'], comp: 'BREAK', note: 'n is 4. The second if’s block runs break, which returns BREAK.' },
  { line: 4, n: 4, running: ['while'], out: ['1', '3'], comp: 'BREAK', note: 'BREAK climbs out exactly as CONTINUE did, through the if’s block and the body, until it reaches the loop, which ends.' },
  { line: 7, n: 4, running: [], out: ['1', '3', 'done'], note: 'The while statement itself finishes NORMAL, so the program’s list carries on: print "done". A break never escapes past its loop.' },
];

const FRAME_W = [150, 124, 98];

export default function LoopSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const top = st.running.length - 1;
  return (
    <StepFrame title="break and continue as values climbing out" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={176} title="The statements currently running, nested inside each other, with a completion value climbing out to the loop; the value of n; and the output.">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>RUNNING</T>
        {st.running.length === 0 && <T x={8} y={40} size={12} fill={tok('muted')}>(top level)</T>}
        {st.running.map((name, k) => {
          const x = 8 + k * 13;
          const y = 22 + k * 30;
          const w = FRAME_W[k];
          const h = 140 - k * 34;
          return (
            <Box key={name} x={x} y={y} w={w} h={h} fill={k === top ? tok('brand', 0.1) : 'transparent'} stroke={k === top ? tok('brand') : tok('ink', 0.4)}>
              <T x={x + 8} y={y + 12} size={11} weight={700} fill={k === top ? tok('brand') : tok('muted')}>{name}</T>
            </Box>
          );
        })}
        {st.comp && (
          <g>
            <rect x={60} y={124} width={86} height={22} rx={11} fill={st.comp === 'NORMAL' ? tok('safe', 0.2) : tok('warn', 0.25)} stroke={st.comp === 'NORMAL' ? tok('safe') : tok('warn')} />
            <T x={103} y={135} size={11.5} mono anchor="middle" weight={700}>{st.comp}</T>
            {st.comp !== 'NORMAL' && <Arrow x1={52} y1={135} x2={30} y2={112} color={tok('warn')} />}
          </g>
        )}
        <T x={180} y={12} size={11} weight={700} fill={tok('muted')}>n</T>
        <Box x={180} y={22} w={60} h={30} fill={tok('f1', 0.12)} stroke={tok('f1')}>
          <T x={210} y={37} size={15} mono weight={700} anchor="middle">{st.n}</T>
        </Box>
        <T x={256} y={12} size={11} weight={700} fill={tok('muted')}>OUTPUT</T>
        <Box x={256} y={22} w={136} h={146} fill={tok('paper')} stroke={tok('ink', 0.3)}>
          {st.out.map((l, i) => (
            <T key={i} x={268} y={40 + i * 20} size={13} mono>{l}</T>
          ))}
        </Box>
      </Svg>
    </StepFrame>
  );
}
