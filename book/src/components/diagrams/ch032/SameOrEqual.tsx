import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

function Arr({ x, y, label }: { x: number; y: number; label: string }) {
  return (
    <g>
      <Box x={x} y={y} w={84} h={30} fill={tok('panel')} stroke={tok('ink', 0.5)}>
        <T x={x + 21} y={y + 15.5} size={14} mono anchor="middle">1</T>
        <line x1={x + 42} y1={y} x2={x + 42} y2={y + 30} stroke={tok('ink', 0.3)} />
        <T x={x + 63} y={y + 15.5} size={14} mono anchor="middle">2</T>
      </Box>
      <T x={x + 42} y={y + 44} size={11} anchor="middle" fill={tok('muted')}>{label}</T>
    </g>
  );
}

/** toBe asks "the same object?"; toEqual asks "the same contents?". */
export default function SameOrEqual() {
  return (
    <Svg w={400} h={196} title="Two names a and b point at two separate arrays that both hold 1 and 2. toBe(a, b) compares the arrows and fails; toEqual compares the contents slot by slot and passes.">
      <T x={8} y={14} size={13} mono weight={700}>a</T>
      <T x={8} y={86} size={13} mono weight={700}>b</T>
      <Arrow x1={22} y1={14} x2={90} y2={22} width={1.5} />
      <Arrow x1={22} y1={86} x2={90} y2={86} width={1.5} />
      <Arr x={94} y={8} label="one array" />
      <Arr x={94} y={72} label="another array" />
      <T x={222} y={28} size={12} mono weight={700} fill={tok('danger')}>toBe: same arrow?</T>
      <T x={222} y={46} size={12} mono fill={tok('danger')}>no, so it fails ✗</T>
      <T x={222} y={84} size={12} mono weight={700} fill={tok('safe')}>toEqual: same</T>
      <T x={222} y={102} size={12} mono weight={700} fill={tok('safe')}>contents?</T>
      <T x={222} y={120} size={12} mono fill={tok('safe')}>1 = 1, 2 = 2 ✓</T>
      <line x1={8} y1={140} x2={392} y2={140} stroke={tok('line')} />
      <T x={8} y={160} size={12} mono>0.1 + 0.2 → 0.30000000000000004</T>
      <T x={8} y={180} size={12} mono><tspan fill={tok('danger')}>toBe(0.3) ✗</tspan>   <tspan fill={tok('safe')}>toBeCloseTo(0.3) ✓</tspan></T>
    </Svg>
  );
}
