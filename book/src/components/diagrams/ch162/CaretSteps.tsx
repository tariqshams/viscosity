import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 162 (second half): which releases a caret range accepts, by
// npm's rules (node-semver ranges: ^1.2.3 := >=1.2.3 <2.0.0,
// ^0.1.0 := >=0.1.0 <0.2.0, ^0.0.1 := >=0.0.1 <0.0.2). The releases on the
// line are made up for the picture; they are in true version order.
const RELEASES = ['0.0.1', '0.0.2', '0.1.0', '0.1.5', '0.2.0', '1.2.3', '1.9.0', '1.10.0', '2.0.0'];

type S = { range: string; lo: number; hi: number; note: string; strings?: boolean };

const STATES: S[] = [
  { range: '', lo: -1, hi: -1, note: 'Nine releases of an imaginary library, in true version order: compare the first part that differs, as a number. Step through to see which of them a dependency range lets npm install.' },
  { range: '^1.2.3', lo: 5, hi: 7, note: '^1.2.3 means "1.2.3 or anything newer that keeps major 1": at least 1.2.3, below 2.0.0. Fixes and features arrive automatically; the breaking 2.0.0 does not.' },
  { range: '^0.1.0', lo: 2, hi: 3, note: '^0.1.0 accepts only 0.1.x: at least 0.1.0, below 0.2.0. In 0.x the minor number is treated as the breaking one, because 0.y.z promises nothing.' },
  { range: '^0.0.1', lo: 0, hi: 0, note: '^0.0.1 accepts 0.0.1 and nothing else: below 0.0.2. This is why Viscosity starts at 0.0.1: nobody who depends on it gets a newer release without asking.' },
  { range: '', lo: 6, hi: 7, strings: true, note: 'The trap: as strings, "1.10.0" < "1.9.0", because the character 1 sorts before 9. As numbers, minor 10 is bigger than minor 9, so 1.10.0 is the newer release.' },
];

export default function CaretSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const W = 43;
  return (
    <StepFrame title="Which releases does a range accept?" steps={s} note={st.note}>
      <Svg w={400} h={150} title="Nine releases on a line from 0.0.1 to 2.0.0, with the releases accepted by the current caret range highlighted">
        <T x={6} y={14} size={11} weight={700} fill={tok('muted')}>RELEASES, OLDEST FIRST</T>
        {st.range && <T x={394} y={14} size={13} mono weight={700} anchor="end" fill={tok('brand')}>{st.range}</T>}
        <line x1={6} y1={62} x2={394} y2={62} stroke={tok('line')} strokeWidth={2} />
        {RELEASES.map((r, k) => {
          const x = 6 + k * W;
          const on = k >= st.lo && k <= st.hi;
          const c = st.strings ? tok('warn') : tok('brand');
          return (
            <g key={r}>
              <Box x={x} y={28} w={W - 2} h={26} r={4} fill={on ? (st.strings ? tok('warn', 0.2) : tok('brand', 0.2)) : tok('panel')} stroke={on ? c : tok('line')}>
                <T x={x + (W - 2) / 2} y={41} size={11} mono anchor="middle" weight={on ? 700 : undefined}>{r}</T>
              </Box>
              <circle cx={x + (W - 2) / 2} cy={62} r={on ? 5 : 3} fill={on ? c : tok('line')} />
            </g>
          );
        })}
        {st.strings ? (
          <>
            <T x={6} y={94} size={12} mono>'1.10.0' &lt; '1.9.0'   // true</T>
            <T x={6} y={116} size={12} mono>[1, 10, 0] vs [1, 9, 0]: 10 &gt; 9</T>
          </>
        ) : st.range ? (
          <T x={6} y={94} size={12}>accepted: {RELEASES.slice(st.lo, st.hi + 1).join(', ')}</T>
        ) : (
          <T x={6} y={94} size={12} fill={tok('muted')}>no range chosen yet</T>
        )}
        <T x={6} y={140} size={11} fill={tok('muted')}>npm installs the newest accepted release</T>
      </Svg>
    </StepFrame>
  );
}
