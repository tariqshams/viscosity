// Chapter 186: the same expression, 1 + 2 * 3, as stack code (left) and as
// three-address code (right). On the stack the product has no name and
// lives for one instruction; in three-address code it is t1, and the line
// that uses it can point straight back at the line that made it.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const STACK: [string, string[]][] = [
  ['CONSTANT 1', ['1']],
  ['CONSTANT 2', ['1', '2']],
  ['CONSTANT 3', ['1', '2', '3']],
  ['MULTIPLY', ['1', '6']],
  ['ADD', ['7']],
];

export default function StackVsNames() {
  return (
    <Svg w={400} h={250} title="Left: stack code for 1 + 2 * 3, with the stack after each instruction; the 6 appears after MULTIPLY and is gone after ADD. Right: t1 = 2 * 3 and t2 = 1 + t1, with an arrow from the use of t1 back to the line that defines it.">
      <T x={8} y={14} size={11} weight={700} fill={tok('muted')}>stack code</T>
      <T x={8} y={30} size={11} fill={tok('muted')}>stack after it, top on the right</T>
      {STACK.map(([ins, st], k) => {
        const y = 56 + k * 36;
        return (
          <g key={k}>
            <T x={8} y={y} size={12} mono>{ins}</T>
            {st.map((v, j) => (
              <Box key={j} x={104 + j * 26} y={y - 11} w={22} h={22} r={3}
                fill={v === '6' ? tok('accent', 0.2) : tok('panel')} stroke={v === '6' ? tok('accent') : tok('line')}>
                <T x={115 + j * 26} y={y} size={12} mono anchor="middle">{v}</T>
              </Box>
            ))}
          </g>
        );
      })}
      <T x={8} y={238} size={11} fill={tok('accent')}>the 6 lives for one step, with no name</T>

      <line x1={196} y1={8} x2={196} y2={222} stroke={tok('line')} strokeWidth={1.5} />
      <T x={210} y={14} size={11} weight={700} fill={tok('muted')}>three-address code</T>
      <Box x={210} y={56} w={180} h={30} fill={tok('brand', 0.1)} stroke={tok('brand')}>
        <T x={220} y={71} size={13} mono><tspan fill={tok('brand')} fontWeight={700}>t1</tspan> = 2 * 3</T>
      </Box>
      <Box x={210} y={128} w={180} h={30} fill={tok('panel')} stroke={tok('line')}>
        <T x={220} y={143} size={13} mono>t2 = 1 + <tspan fill={tok('brand')} fontWeight={700}>t1</tspan></T>
      </Box>
      <Arrow x1={330} y1={128} x2={250} y2={88} color={tok('brand')} bend={-0.6} />
      <T x={210} y={186} size={11} fill={tok('muted')}>each value has a name, so</T>
      <T x={210} y={202} size={11} fill={tok('muted')}>a use points straight at</T>
      <T x={210} y={218} size={11} fill={tok('muted')}>the line that made it</T>
    </Svg>
  );
}
