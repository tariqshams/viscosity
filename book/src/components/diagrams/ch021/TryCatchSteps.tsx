import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const code = (arg: string) => `function check(n) {
  if (n < 0) throw new Error('neg');
  return n;
}
try {
  console.log(check(${arg}));
  console.log('after');
} catch (e) {
  console.log('caught ' + e.message);
} finally {
  console.log('finally');
}
console.log('carry on');`;

type Block = 'try' | 'catch' | 'finally' | 'after';
type Mark = 'now' | 'ran' | 'cut short' | 'skipped' | undefined;
type S = { arg: string; line: number; marks: Partial<Record<Block, Mark>>; out: string[]; note: string };

const STATES: S[] = [
  { arg: '2', line: 4, marks: { try: 'now' }, out: [], note: 'First run: check(2). The try block starts. JavaScript remembers “if anything in here throws, go to the catch”.' },
  { arg: '2', line: 5, marks: { try: 'now' }, out: ['2'], note: 'check(2) is not negative, so it returns 2, and console.log prints it.' },
  { arg: '2', line: 6, marks: { try: 'now' }, out: ['2', 'after'], note: 'Nothing threw, so the try block runs to its last line and prints after.' },
  { arg: '2', line: 10, marks: { try: 'ran', catch: 'skipped', finally: 'now' }, out: ['2', 'after', 'finally'], note: 'Nothing was thrown, so the catch block is skipped completely. finally runs anyway.' },
  { arg: '2', line: 12, marks: { try: 'ran', catch: 'skipped', finally: 'ran', after: 'now' }, out: ['2', 'after', 'finally', 'carry on'], note: 'The program carries on after the whole statement. Now the same code with check(-1).' },
  { arg: '-1', line: 5, marks: { try: 'now' }, out: [], note: 'Second run: check(-1). Inside check, n < 0 is true, so throw raises an Error with the message neg. check stops without returning.' },
  { arg: '-1', line: 8, marks: { try: 'cut short', catch: 'now' }, out: ['caught neg'], note: 'The rest of the try block is skipped: neither console.log on lines 6 and 7 runs. Control jumps to catch, with the Error in e.' },
  { arg: '-1', line: 10, marks: { try: 'cut short', catch: 'ran', finally: 'now' }, out: ['caught neg', 'finally'], note: 'After catch, finally runs, exactly as it did when nothing was thrown.' },
  { arg: '-1', line: 12, marks: { try: 'cut short', catch: 'ran', finally: 'ran', after: 'now' }, out: ['caught neg', 'finally', 'carry on'], note: 'The error was handled, so the program carries on normally. Compare the two outputs: finally and carry on appear in both.' },
];

const BLOCKS: { id: Block; label: string }[] = [
  { id: 'try', label: 'try' }, { id: 'catch', label: 'catch' }, { id: 'finally', label: 'finally' }, { id: 'after', label: 'after' },
];

export default function TryCatchSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Which blocks run?" steps={s} note={st.note}>
      <CodeTrace code={code(st.arg)} line={st.line} />
      <Svg w={400} h={118} title="Four blocks, try, catch, finally and the code after, each marked as running now, ran, or skipped, with the printed output underneath.">
        {BLOCKS.map((b, k) => {
          const m = st.marks[b.id];
          const x = 4 + k * 99;
          const stroke = m === 'now' ? tok('brand') : m === 'ran' ? tok('safe') : m === 'cut short' ? tok('danger') : m === 'skipped' ? tok('muted') : tok('line');
          const fill = m === 'now' ? tok('brand', 0.16) : m === 'ran' ? tok('safe', 0.12) : 'transparent';
          return (
            <Box key={b.id} x={x} y={6} w={92} h={40} r={6} stroke={stroke} fill={fill} dash={m === 'skipped' || !m}>
              <T x={x + 46} y={20} size={12.5} mono weight={700} anchor="middle">{b.label}</T>
              <T x={x + 46} y={36} size={11} anchor="middle" fill={tok('muted')}>{m === 'now' ? 'running' : m ?? ''}</T>
            </Box>
          );
        })}
        <T x={8} y={62} size={11} weight={700} fill={tok('muted')}>PRINTED (check({st.arg}))</T>
        {st.out.map((o, k) => (
          <T key={k} x={8 + (k % 2) * 196} y={80 + Math.floor(k / 2) * 18} size={12.5} mono>{o}</T>
        ))}
      </Svg>
    </StepFrame>
  );
}
