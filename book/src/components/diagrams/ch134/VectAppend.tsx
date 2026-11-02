// Lengths in types: appending a Vect 2 to a Vect 3 gives a Vect 5, and the
// type checker can see the 5.
import { Box, Svg, T, tok } from '../../viz/svg';

function Cells({ x, y, items, colour }: { x: number; y: number; items: string[]; colour: string }) {
  return (
    <g>
      {items.map((it, k) => (
        <Box key={k} x={x + k * 30} y={y} w={26} h={26} fill={tok('panel')} stroke={colour}>
          <T x={x + k * 30 + 13} y={y + 13} size={12} mono anchor="middle">{it}</T>
        </Box>
      ))}
    </g>
  );
}

export default function VectAppend() {
  return (
    <Svg w={400} h={180} title="A vector of two numbers with type Vect 2 Number, plus a vector of three with type Vect 3 Number, gives a vector of five with type Vect (2 + 3) Number, which is Vect 5 Number.">
      <Cells x={20} y={20} items={['1', '2']} colour={tok('brand')} />
      <T x={20} y={62} size={12} mono fill={tok('brand')}>Vect 2 Nat</T>
      <T x={104} y={33} size={16} weight={700}>++</T>
      <Cells x={140} y={20} items={['7', '8', '9']} colour={tok('accent')} />
      <T x={140} y={62} size={12} mono fill={tok('accent')}>Vect 3 Nat</T>
      <T x={250} y={33} size={16} weight={700}>=</T>
      <Cells x={20} y={96} items={['1', '2', '7', '8', '9']} colour={tok('safe')} />
      <T x={180} y={109} size={12} mono fill={tok('safe')}>Vect (2 + 3) Nat</T>
      <T x={180} y={127} size={12} mono fill={tok('safe')}>= Vect 5 Nat</T>
      <T x={200} y={162} size={11} anchor="middle" fill={tok('muted')}>(++) : Vect n a → Vect m a → Vect (n + m) a</T>
    </Svg>
  );
}
