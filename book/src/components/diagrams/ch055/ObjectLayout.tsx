import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// The objects a = { x: 0.5, n: 3 } and b = { x: 2.5, n: 7 }, as V8's blog
// describes objects: a header of three words (hidden class, properties
// store, elements store), then the in-object properties. n is a Smi stored
// in its slot; x is a double, so its slot points to a separate box on the
// heap. Objects of the same shape share one hidden class.
const HEADER = ['hidden class', 'properties', 'elements'];
const Y = 92;

function Obj({ x0, name, xv, nv }: { x0: number; name: string; xv: string; nv: string }) {
  return (
    <g>
      <T x={x0} y={Y - 10} size={13} mono weight={700}>{name}</T>
      {HEADER.map((h, k) => (
        <Box key={h} x={x0} y={Y + k * 30} w={118} h={26} r={3} fill={tok('ink', 0.07)} stroke={tok('ink', 0.35)}>
          <T x={x0 + 8} y={Y + 13 + k * 30} size={11} mono fill={tok('muted')}>{h}</T>
        </Box>
      ))}
      <Box x={x0} y={Y + 92} w={118} h={26} r={3} fill={tok('f1', 0.15)} stroke={tok('f1')}>
        <T x={x0 + 8} y={Y + 105} size={12} mono weight={700} fill={tok('f1')}>x</T>
        <T x={x0 + 28} y={Y + 105} size={11} mono>pointer</T>
      </Box>
      <Box x={x0} y={Y + 122} w={118} h={26} r={3} fill={tok('f5', 0.15)} stroke={tok('f5')}>
        <T x={x0 + 8} y={Y + 135} size={12} mono weight={700} fill={tok('f5')}>n</T>
        <T x={x0 + 28} y={Y + 135} size={11} mono>Smi {nv}</T>
      </Box>
      <Box x={x0 + 4} y={Y + 168} w={110} h={32} r={6} fill={tok('brand', 0.12)} stroke={tok('brand')}>
        <T x={x0 + 12} y={Y + 178} size={10} fill={tok('muted')}>double, on the heap</T>
        <T x={x0 + 12} y={Y + 192} size={12} mono>{xv}</T>
      </Box>
      <Arrow x1={x0 + 112} y1={Y + 105} x2={x0 + 100} y2={Y + 166} bend={-0.5} width={1.5} />
    </g>
  );
}

export default function ObjectLayout() {
  return (
    <Svg w={400} h={322} title="Two objects, a and b, each with a three-word header (hidden class, properties, elements) followed by the fields x and n. Both hidden-class words point to one shared shape that says x is in slot 0 and n in slot 1. n holds a small integer directly; x points to a double stored separately on the heap.">
      <Box x={140} y={6} w={120} h={60} r={6} fill={tok('accent', 0.12)} stroke={tok('accent')}>
        <T x={200} y={20} size={10} weight={700} anchor="middle" fill={tok('accent')}>HIDDEN CLASS</T>
        <T x={200} y={38} size={11} mono anchor="middle">x: slot 0</T>
        <T x={200} y={54} size={11} mono anchor="middle">n: slot 1</T>
      </Box>
      <Obj x0={8} name="a" xv="0.5" nv="3" />
      <Obj x0={274} name="b" xv="2.5" nv="7" />
      <Arrow x1={126} y1={Y + 13} x2={146} y2={60} width={1.4} color={tok('accent')} />
      <Arrow x1={274} y1={Y + 13} x2={254} y2={60} width={1.4} color={tok('accent')} />
      <T x={200} y={Y + 70} size={11} anchor="middle" fill={tok('muted')}>header:</T>
      <T x={200} y={Y + 84} size={11} anchor="middle" fill={tok('muted')}>3 words</T>
      <T x={200} y={Y + 120} size={11} anchor="middle" fill={tok('muted')}>then the</T>
      <T x={200} y={Y + 134} size={11} anchor="middle" fill={tok('muted')}>fields</T>
      <T x={200} y={314} size={11} anchor="middle" fill={tok('muted')}>a = {'{ x: 0.5, n: 3 }'}   b = {'{ x: 2.5, n: 7 }'}</T>
    </Svg>
  );
}
