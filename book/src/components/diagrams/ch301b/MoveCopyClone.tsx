// Chapter 301-b: the three things `let x = y;` (or y.clone()) can do.
// A Copy type is duplicated bit for bit and both names stay usable; a
// String is moved (its stack part is copied, the old name is dead, the
// heap text has one owner still); clone makes a second heap copy with a
// second owner.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

function Slot({ x, y, name, text, dead }: { x: number; y: number; name: string; text: string; dead?: boolean }) {
  return (
    <g opacity={dead ? 0.4 : 1}>
      <T x={x} y={y + 12} size={13} mono weight={700}>{name}</T>
      <Box x={x + 16} y={y} w={84} h={24} fill={tok('panel')} stroke={dead ? tok('muted') : tok('ink', 0.5)} dash={dead}>
        <T x={x + 58} y={y + 12} size={11} mono anchor="middle">{text}</T>
      </Box>
    </g>
  );
}

function Heap({ x, y }: { x: number; y: number }) {
  return (
    <Box x={x} y={y} w={56} h={24} fill={tok('accent', 0.12)} stroke={tok('accent')}>
      <T x={x + 28} y={y + 12} size={13} mono anchor="middle">"fib"</T>
    </Box>
  );
}

export default function MoveCopyClone() {
  return (
    <Svg w={400} h={232} title="Copy duplicates a number; a move hands a String's heap text to a new owner; clone makes a second heap copy">
      <T x={8} y={12} size={12} weight={700} fill={tok('safe')}>copy</T>
      <T x={60} y={12} size={11} mono>let m = n;  (n: i32)</T>
      <Slot x={8} y={22} name="n" text="7" />
      <Slot x={124} y={22} name="m" text="7" />
      <T x={234} y={34} size={11} fill={tok('muted')}>two 7s; both usable</T>

      <T x={8} y={72} size={12} weight={700} fill={tok('warn')}>move</T>
      <T x={60} y={72} size={11} mono>let b = a;  (a: String)</T>
      <Slot x={8} y={82} name="a" text="moved" dead />
      <Slot x={124} y={82} name="b" text="ptr len cap" />
      <Arrow x1={224} y1={94} x2={248} y2={94} color={tok('ink', 0.7)} />
      <Heap x={250} y={82} />
      <T x={314} y={88} size={11} fill={tok('muted')}>one owner;</T>
      <T x={314} y={102} size={11} fill={tok('muted')}>a is unusable</T>

      <T x={8} y={140} size={12} weight={700} fill={tok('brand')}>clone</T>
      <T x={60} y={140} size={11} mono>let c = b.clone();</T>
      <Slot x={8} y={152} name="b" text="ptr len cap" />
      <Slot x={8} y={190} name="c" text="ptr len cap" />
      <Arrow x1={108} y1={164} x2={232} y2={164} color={tok('ink', 0.7)} />
      <Arrow x1={108} y1={202} x2={232} y2={202} color={tok('ink', 0.7)} />
      <Heap x={234} y={152} />
      <Heap x={234} y={190} />
      <T x={298} y={170} size={11} fill={tok('muted')}>two texts,</T>
      <T x={298} y={184} size={11} fill={tok('muted')}>two owners</T>
    </Svg>
  );
}
