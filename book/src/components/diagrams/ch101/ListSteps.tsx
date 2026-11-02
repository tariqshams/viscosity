import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const CODE = `let xs = [1, 2];
for x in xs {
  if x < 4 { push(xs, x + 2); }
  print x;
}`;

type S = {
  line: number;
  items: number[];
  /** index of the element x holds, or null */
  cur: number | null;
  /** how many times round so far (each has its own x) */
  round: number;
  pushed?: boolean;
  check?: string;
  out: string[];
  note: string;
};

const STATES: S[] = [
  { line: 0, items: [1, 2], cur: null, round: 0, out: [], note: 'A list literal: evaluate 1, then 2, and wrap them in a new DripList. xs holds a reference to it.' },
  { line: 1, items: [1, 2], cur: 0, round: 1, check: '0 < 2', out: [], note: 'The for evaluates xs once. Then it asks: is the position 0 below the length, 2? Yes, so x = 1, defined in a fresh environment for this round.' },
  { line: 2, items: [1, 2, 3], cur: 0, round: 1, pushed: true, out: [], note: '1 < 4, so push(xs, 3). The list the loop is walking is now three long.' },
  { line: 3, items: [1, 2, 3], cur: 0, round: 1, out: ['1'], note: 'print x shows 1. The body ends, and so does this round’s environment.' },
  { line: 2, items: [1, 2, 3, 4], cur: 1, round: 2, check: '1 < 3', pushed: true, out: ['1'], note: 'Next round: 1 is below the length read NOW, 3. A new x holds 2, and 2 < 4 pushes 4.' },
  { line: 3, items: [1, 2, 3, 4], cur: 1, round: 2, out: ['1', '2'], note: 'print 2.' },
  { line: 3, items: [1, 2, 3, 4, 5], cur: 2, round: 3, check: '2 < 4', pushed: true, out: ['1', '2', '3'], note: 'Round three visits the 3 that was pushed in round one: the length is read again each time. It pushes 5 and prints 3.' },
  { line: 3, items: [1, 2, 3, 4, 5], cur: 3, round: 4, check: '3 < 5', out: ['1', '2', '3', '4'], note: 'x = 4 is not below 4, so nothing is pushed this time. print 4.' },
  { line: 3, items: [1, 2, 3, 4, 5], cur: 4, round: 5, check: '4 < 5', out: ['1', '2', '3', '4', '5'], note: 'x = 5: no push, print 5.' },
  { line: 1, items: [1, 2, 3, 4, 5], cur: null, round: 5, check: '5 < 5', out: ['1', '2', '3', '4', '5'], note: 'Position 5 is not below the length 5, so the loop ends. Five rounds, five separate x variables, and the list it walked grew under it.' },
];

const CW = 40;

export default function ListSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="for x in xs, while the body pushes onto xs" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={190} title="The list being walked, drawn as numbered cells, with the cell x currently holds marked; the length check made before each round; and the output.">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>xs (a DripList)</T>
        {st.items.map((v, k) => {
          const x = 8 + k * CW;
          const isCur = st.cur === k;
          const isNew = st.pushed && k === st.items.length - 1;
          return (
            <g key={k}>
              <Box x={x} y={22} w={CW - 4} h={32} fill={isCur ? tok('brand', 0.18) : isNew ? tok('safe', 0.15) : tok('panel')} stroke={isCur ? tok('brand') : isNew ? tok('safe') : tok('ink', 0.4)}>
                <T x={x + (CW - 4) / 2} y={38} size={14} mono anchor="middle" weight={isCur ? 700 : 400}>{v}</T>
              </Box>
              <T x={x + (CW - 4) / 2} y={64} size={11} mono anchor="middle" fill={tok('muted')}>{k}</T>
            </g>
          );
        })}
        {st.cur !== null && (
          <g>
            <Arrow x1={8 + st.cur * CW + 18} y1={96} x2={8 + st.cur * CW + 18} y2={72} color={tok('brand')} />
            <T x={8 + st.cur * CW + 18} y={108} size={12} mono anchor="middle" fill={tok('brand')} weight={700}>x</T>
          </g>
        )}
        <T x={8} y={134} size={12}>length now: <tspan className="mono" fontWeight={700}>{st.items.length}</tspan></T>
        {st.check && <T x={8} y={154} size={12}>check before round: <tspan className="mono" fontWeight={700}>{st.check}</tspan></T>}
        <T x={8} y={174} size={12}>rounds so far (one fresh x each): <tspan className="mono" fontWeight={700}>{st.round}</tspan></T>
        <T x={276} y={84} size={11} weight={700} fill={tok('muted')}>OUTPUT</T>
        <Box x={276} y={92} w={116} h={94} fill={tok('paper')} stroke={tok('ink', 0.3)}>
          <T x={288} y={110} size={13} mono>{st.out.join(' ')}</T>
        </Box>
      </Svg>
    </StepFrame>
  );
}
