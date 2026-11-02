// Chapter 80: resolveLocal scanning the compiler's locals array from the
// end, for `print x` in
//   { let x = 1; { let y = 2; let x = 3; print x; } }
// The inner x (index 3) is found first, so the outer x (index 1) is
// shadowed; the compiler emits load.local 3, as the real disassembly shows.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

/** [name shown, depth, role] */
const LOCALS: [string, number, 'slot0' | 'hidden' | 'skip' | 'found'][] = [
  ['(script)', 0, 'slot0'],
  ['x', 1, 'hidden'],
  ['y', 2, 'skip'],
  ['x', 2, 'found'],
];

const W = 88;
const X = (i: number) => 18 + i * (W + 6);

export default function ResolveFigure() {
  return (
    <Svg w={400} h={190} title="The locals array with four entries: slot 0, x at depth 1, y at depth 2, and x at depth 2. The search for x starts at the right-hand end. It checks index 3 first, which is x, and stops there, so the outer x at index 1 is never reached.">
      <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>COMPILER: locals (index = stack slot)</T>
      {LOCALS.map(([name, depth, role], i) => {
        const found = role === 'found';
        const hidden = role === 'hidden';
        return (
          <g key={i}>
            <T x={X(i) + W / 2} y={34} size={11} mono anchor="middle" fill={tok('muted')}>{i}</T>
            <Box x={X(i)} y={44} w={W} h={44} fill={found ? tok('brand', 0.16) : tok('panel')} stroke={found ? tok('brand') : tok('line')} dash={hidden} opacity={hidden ? 0.6 : 1}>
              <T x={X(i) + W / 2} y={60} size={13} mono weight={700} anchor="middle">{name}</T>
              <T x={X(i) + W / 2} y={78} size={11} mono anchor="middle" fill={tok('muted')}>depth {depth}</T>
            </Box>
          </g>
        );
      })}
      <Arrow x1={392} y1={112} x2={X(3) + 20} y2={112} color={tok('brand')} />
      <T x={X(3) + W / 2 + 4} y={126} size={11} anchor="middle" fill={tok('brand')}>start here</T>
      <T x={X(3) + W / 2} y={146} size={11.5} mono anchor="middle" weight={700} fill={tok('brand')}>match: slot 3</T>
      <T x={X(2) + W / 2} y={104} size={11} anchor="middle" fill={tok('muted')}>never</T>
      <T x={X(1) + W / 2} y={104} size={11} anchor="middle" fill={tok('muted')}>reached</T>
      <T x={8} y={168} size={11.5}>print x searches from the end, finds the inner x</T>
      <T x={8} y={184} size={11.5}>first, and stops: the outer x is shadowed.</T>
    </Svg>
  );
}
