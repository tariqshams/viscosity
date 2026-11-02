import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 131-b: what assert_eq!(left, right, message) does, one step at a
// time, on the chapter's AoS slot example. The panic text is the real
// rustc 1.97 output of that program.
const CODE = `// slot(i, f, nf) has a bug:
// it returns f * nf + i
assert_eq!(slot(0, 0, 2), 0);
assert_eq!(slot(3, 1, 2), 7,
    "element 3, field 1");`;

type S = { line: number; left?: string; right?: string; eq?: boolean; panic?: string[]; note: string };

const STATES: S[] = [
  { line: 2, note: 'assert_eq! takes two values and an optional message. First it works out each side exactly once.' },
  { line: 2, left: '0', right: '0', note: 'slot(0, 0, 2) is 0 * 2 + 0 = 0, and the right side is 0. The bug does not show for element 0, field 0.' },
  { line: 2, left: '0', right: '0', eq: true, note: 'It compares them with ==, which needs PartialEq. They are equal, so nothing happens and the program carries on.' },
  { line: 3, left: '5', right: '7', note: 'Next: slot(3, 1, 2) works out as 1 * 2 + 3 = 5 with the bug; the right answer, 3 * 2 + 1, is 7.' },
  { line: 3, left: '5', right: '7', eq: false, note: '5 == 7 is false. Now assert_eq! builds a message, printing both values with Debug (so both sides must implement Debug).' },
  { line: 3, left: '5', right: '7', eq: false, panic: ['assertion `left == right` failed:', '  element 3, field 1', '  left: 5', ' right: 7'], note: 'Then it panics with that message. In a test, the panic fails the test; in a program, it stops the thread. Your message comes first, then both values.' },
];

export default function AssertSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Inside assert_eq!" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={130} title="The two values assert_eq compares, and the panic message when they differ">
        <T x={8} y={14} size={11} weight={700} fill={tok('muted')}>LEFT</T>
        <Box x={8} y={22} w={64} h={32} fill={tok('panel')} stroke={tok('f1')} dash={!st.left}>
          <T x={40} y={38} size={15} mono anchor="middle">{st.left ?? ''}</T>
        </Box>
        <T x={92} y={38} size={15} mono anchor="middle" fill={st.eq === undefined ? tok('muted') : tok(st.eq ? 'safe' : 'danger')}>{st.eq === undefined ? '==' : st.eq ? '==' : '!='}</T>
        <T x={112} y={14} size={11} weight={700} fill={tok('muted')}>RIGHT</T>
        <Box x={112} y={22} w={64} h={32} fill={tok('panel')} stroke={tok('f2')} dash={!st.right}>
          <T x={144} y={38} size={15} mono anchor="middle">{st.right ?? ''}</T>
        </Box>
        {st.eq === true && <T x={196} y={38} size={12} fill={tok('safe')}>equal: carry on</T>}
        {st.eq === false && !st.panic && <T x={196} y={38} size={12} fill={tok('danger')}>different: build a message</T>}
        {st.panic && (
          <Box x={8} y={62} w={384} h={64} fill={tok('danger', 0.08)} stroke={tok('danger')}>
            {st.panic.map((l, k) => (
              <T key={k} x={16} y={74 + k * 15} size={11} mono>{l.replace(/^ +/, (m) => ' '.repeat(m.length))}</T>
            ))}
          </Box>
        )}
      </Svg>
    </StepFrame>
  );
}
