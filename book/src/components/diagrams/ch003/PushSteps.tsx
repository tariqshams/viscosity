import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const CODE = `const xs = [90, 72, 85];
console.log(xs[1]);
xs[1] = 75;
xs.push(64);
console.log(xs.length);
console.log(xs[4]);`;

type S = { line: number; xs: number[]; hot?: number; kind?: 'read' | 'write' | 'new' | 'missing'; out?: string; note: string };

const STATES: S[] = [
  { line: 0, xs: [90, 72, 85], note: 'The square brackets make an array with three slots, numbered 0, 1 and 2. Its length is 3.' },
  { line: 1, xs: [90, 72, 85], hot: 1, kind: 'read', out: '72', note: 'xs[1] reads slot 1, which is the second slot (one step from the start), so this prints 72.' },
  { line: 2, xs: [90, 75, 85], hot: 1, kind: 'write', note: 'With = after it, xs[1] is written instead of read: slot 1 now holds 75, and the old 72 is gone.' },
  { line: 3, xs: [90, 75, 85, 64], hot: 3, kind: 'new', note: 'push adds a brand-new slot at the end. It gets the next index, 3, and the length grows from 3 to 4.' },
  { line: 4, xs: [90, 75, 85, 64], out: '4', note: 'length is now 4, which means the last index is 4 − 1 = 3.' },
  { line: 5, xs: [90, 75, 85, 64], hot: 4, kind: 'missing', out: 'undefined', note: 'There is no slot 4, so xs[4] gives undefined. JavaScript does not stop with an error; it hands you “nothing” and carries on.' },
];

export default function PushSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const slots = st.kind === 'missing' ? st.xs.length + 1 : st.xs.length;
  return (
    <StepFrame title="Read, write, grow" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={130} title="The array xs, its slots and indexes, and its length">
        <T x={8} y={12} size={13} mono weight={700}>xs</T>
        <T x={392} y={12} size={12} mono anchor="end" fill={tok('muted')}>length: {st.xs.length}</T>
        {Array.from({ length: slots }, (_, k) => {
          const x = 8 + k * 78;
          const hot = st.hot === k;
          const missing = k >= st.xs.length;
          const colour = missing ? tok('danger') : hot ? tok('brand') : tok('ink', 0.45);
          return (
            <g key={k}>
              <Box x={x} y={26} w={70} h={48} dash={missing} fill={missing ? 'transparent' : hot ? tok('brand', 0.16) : tok('panel')} stroke={colour}>
                <T x={x + 35} y={50} size={missing ? 11 : 19} mono anchor="middle" fill={missing ? tok('danger') : undefined}>
                  {missing ? 'no slot' : st.xs[k]}
                </T>
              </Box>
              <T x={x + 35} y={88} size={12} mono anchor="middle" fill={hot ? colour : tok('muted')} weight={hot ? 700 : 400}>{k}</T>
            </g>
          );
        })}
        {st.kind && (
          <T x={8} y={110} size={12} weight={700} fill={st.kind === 'missing' ? tok('danger') : tok('brand')}>
            {st.kind === 'read' ? 'reading slot 1' : st.kind === 'write' ? 'writing slot 1' : st.kind === 'new' ? 'new slot from push' : 'reading past the end'}
          </T>
        )}
        {st.out && <T x={392} y={110} size={13} mono anchor="end">prints: {st.out}</T>}
      </Svg>
    </StepFrame>
  );
}
