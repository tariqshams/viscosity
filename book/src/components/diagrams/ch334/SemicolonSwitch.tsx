// Chapter 334: one character decides a block's value. Left, a block
// whose last line has no semicolon: that line is the block's value. Right,
// the same block with a semicolon: every line is a statement, so the block
// is worth (), the unit value.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

function Block({ x, semi }: { x: number; semi: boolean }) {
  const col = semi ? tok('danger') : tok('safe');
  return (
    <g>
      <T x={x + 88} y={14} size={12} weight={700} anchor="middle" fill={col}>{semi ? 'with ;' : 'without ;'}</T>
      <Box x={x} y={24} w={176} h={92} fill={tok('panel')} stroke={tok('ink', 0.4)}>
        <T x={x + 10} y={42} size={13} mono>{'{'}</T>
        <T x={x + 26} y={62} size={13} mono fill={tok('muted')}>let a = 3;</T>
        <T x={x + 26} y={82} size={13} mono weight={700}>a + 1{semi && <tspan fill={col}>;</tspan>}</T>
        <T x={x + 10} y={102} size={13} mono>{'}'}</T>
      </Box>
      <Arrow x1={x + 88} y1={118} x2={x + 88} y2={146} color={col} />
      <Box x={x + 28} y={150} w={120} h={36} fill={semi ? tok('danger', 0.1) : tok('safe', 0.12)} stroke={col}>
        <T x={x + 88} y={168} size={15} mono weight={700} anchor="middle" fill={col}>{semi ? '()' : '4'}</T>
      </Box>
      <T x={x + 88} y={202} size={11} anchor="middle" fill={tok('muted')}>{semi ? 'unit: nothing to report' : 'type i32'}</T>
      <T x={x + 88} y={218} size={11} anchor="middle" fill={tok('muted')}>{semi ? 'every line a statement' : 'the last line is the value'}</T>
    </g>
  );
}

export default function SemicolonSwitch() {
  return (
    <Svg w={400} h={228} title="A block ending in an expression is worth that expression; with a semicolon it is worth ()">
      <Block x={8} semi={false} />
      <Block x={216} semi />
    </Svg>
  );
}
