import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// An ObjString as the companion VM defines it: the shared header
// (isMarked, next), then the type tag and the string's own fields.
const FIELDS = [
  { k: 'isMarked', v: 'false', header: true },
  { k: 'next', v: '→ older object', header: true },
  { k: 'type', v: "'string'" },
  { k: 'chars', v: '"teapot"' },
  { k: 'hash', v: '(a number)' },
];

export default function ObjLayout() {
  return (
    <Svg w={400} h={210} title="An ObjString: a header with isMarked and next, then type, chars and hash. A stack slot holds only a reference to it.">
      <T x={10} y={12} size={11} weight={700} fill={tok('muted')}>STACK SLOT</T>
      <T x={170} y={12} size={11} weight={700} fill={tok('muted')}>HEAP: ONE ObjString</T>
      <Box x={10} y={28} w={44} h={34} r={4} fill={tok('brand', 0.2)} stroke={tok('brand')}>
        <T x={32} y={45} size={13} mono weight={700} anchor="middle">obj</T>
      </Box>
      <Box x={56} y={28} w={70} h={34} r={4} stroke={tok('ink', 0.5)}>
        <T x={91} y={45} size={12} mono anchor="middle">address</T>
      </Box>
      <Arrow x1={126} y1={45} x2={166} y2={45} />
      {FIELDS.map((f, k) => {
        const y = 28 + k * 32;
        return (
          <Box key={f.k} x={168} y={y} w={224} h={30} r={3} fill={f.header ? tok('accent', 0.12) : tok('brand', 0.08)} stroke={f.header ? tok('accent') : tok('brand')}>
            <T x={178} y={y + 15} size={13} mono weight={700}>{f.k}</T>
            <T x={268} y={y + 15} size={13} mono fill={tok('muted')}>{f.v}</T>
          </Box>
        );
      })}
      <T x={10} y={104} size={11} fill={tok('accent')}>header: every</T>
      <T x={10} y={118} size={11} fill={tok('accent')}>object has these</T>
      <T x={10} y={196} size={11} fill={tok('muted')}>The slot stays small; the object can be any size.</T>
    </Svg>
  );
}
