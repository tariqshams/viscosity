// Soundness as a chain: progress gives the next arrow, preservation keeps
// the label ": T" on every term, until a value is reached.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const XS = [48, 148, 248, 348];
const LABELS = ['e₀', 'e₁', 'e₂', 'v'];

export default function TwoLemmas() {
  return (
    <Svg w={400} h={150} title="Four boxes in a row, e0, e1, e2 and a value v, each labelled with the same type T. Solid arrows between them are labelled progress; the repeated type is labelled preservation.">
      {XS.map((x, k) => (
        <g key={k}>
          <Box x={x - 36} y={36} w={72} h={40} stroke={k === 3 ? tok('safe') : tok('brand')} fill={k === 3 ? tok('safe', 0.1) : tok('panel')}>
            <T x={x} y={56} size={14} mono anchor="middle" weight={700}>{LABELS[k]}</T>
          </Box>
          <T x={x} y={92} size={13} mono anchor="middle" fill={tok('accent')}>: T</T>
          {k < 3 && <Arrow x1={x + 38} y1={56} x2={x + 62} y2={56} color={tok('brand')} />}
        </g>
      ))}
      <T x={200} y={18} size={11} anchor="middle" fill={tok('brand')}>progress: each typed non-value takes a step (→)</T>
      <T x={200} y={114} size={11} anchor="middle" fill={tok('accent')}>preservation: the type is the same after every step</T>
      <T x={200} y={136} size={11} anchor="middle" fill={tok('muted')}>together: a typed term is never stuck</T>
    </Svg>
  );
}
