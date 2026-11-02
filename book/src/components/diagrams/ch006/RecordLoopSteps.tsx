import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const CODE = `const ps = [
  { x: 0, vx: 1 },
  { x: 5, vx: -1 },
  { x: 9, vx: 2 },
];
for (let i = 0; i < ps.length; i++) {
  const p = ps[i];
  p.x = p.x + p.vx;
}`;

const VX = [1, -1, 2];

type S = { line: number; i?: number; p?: number; xs: number[]; changed?: number; note: string };

const STATES: S[] = [
  { line: 0, xs: [0, 5, 9], note: 'One array, three slots, and each slot holds a whole particle object with its own x and vx.' },
  { line: 5, i: 0, xs: [0, 5, 9], note: 'The loop starts with i = 0. The check 0 < ps.length (3) is true, so the body runs.' },
  { line: 6, i: 0, p: 0, xs: [0, 5, 9], note: 'const p = ps[i] picks out the object in slot 0 and gives it the short name p for this pass.' },
  { line: 7, i: 0, p: 0, xs: [1, 5, 9], changed: 0, note: 'p.x = p.x + p.vx reads 0 and 1 from that object and writes 1 back into its x. The object in the array has changed.' },
  { line: 6, i: 1, p: 1, xs: [1, 5, 9], note: 'i becomes 1, the check passes, and p now names the object in slot 1.' },
  { line: 7, i: 1, p: 1, xs: [1, 4, 9], changed: 1, note: 'Its x moves by its own vx: 5 + (−1) = 4. Each record carries its own speed.' },
  { line: 7, i: 2, p: 2, xs: [1, 4, 11], changed: 2, note: 'Slot 2: 9 + 2 = 11. Every particle has now moved once.' },
  { line: 5, i: 3, xs: [1, 4, 11], note: 'i becomes 3, and 3 < 3 is false, so the loop ends. Notice that the loop never touched anything but x and vx.' },
];

export default function RecordLoopSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="A loop over records" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={160} title="Three particle objects in the slots of ps, the loop counter i, and the name p pointing at the current object">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>THE ARRAY ps</T>
        {[0, 1, 2].map((k) => {
          const x = 8 + k * 130;
          const on = st.p === k;
          return (
            <g key={k}>
              <Box x={x} y={22} w={122} h={78} r={7} fill={on ? tok('brand', 0.1) : tok('panel')} stroke={on ? tok('brand') : tok('ink', 0.4)}>
                <rect x={x + 8} y={32} width={106} height={26} rx={3} fill={tok('f1', st.changed === k ? 0.35 : 0.14)} stroke={tok('f1')} />
                <T x={x + 16} y={45.5} size={14} mono weight={700} fill={tok('f1')}>x</T>
                <T x={x + 90} y={45.5} size={15} mono anchor="middle">{st.xs[k]}</T>
                <rect x={x + 8} y={64} width={106} height={26} rx={3} fill={tok('f3', 0.14)} stroke={tok('f3')} />
                <T x={x + 16} y={77.5} size={14} mono weight={700} fill={tok('f3')}>vx</T>
                <T x={x + 90} y={77.5} size={15} mono anchor="middle">{VX[k]}</T>
              </Box>
              <T x={x + 61} y={114} size={13} mono anchor="middle" fill={tok('muted')}>[{k}]</T>
            </g>
          );
        })}
        <Box x={8} y={128} w={70} h={28} stroke={tok('ink', 0.4)}>
          <T x={18} y={142.5} size={14} mono>i = {st.i === undefined ? '' : st.i}</T>
        </Box>
        {st.p !== undefined && (
          <g>
            <Box x={150} y={128} w={44} h={28} stroke={tok('brand')}>
              <T x={164} y={142.5} size={14} mono weight={700} fill={tok('brand')}>p</T>
            </Box>
            <Arrow x1={172} y1={128} x2={8 + st.p * 130 + 61} y2={122} color={tok("brand")} />
          </g>
        )}
      </Svg>
    </StepFrame>
  );
}
