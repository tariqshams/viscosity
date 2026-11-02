import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// The companion VM's list object for `["tea", 20, none]`: a stack slot holds
// a reference; the ObjList has the shared header, its type, and `items`, a
// JavaScript array of Values; an element that is itself an object (the
// string) is one more reference.
const HEADER = [
  { k: 'isMarked', v: 'false' },
  { k: 'next', v: '→ older object' },
  { k: 'type', v: "'list'" },
  { k: 'items', v: '→ (below)' },
];
const CELLS = [
  { i: 0, v: 'ref', obj: true },
  { i: 1, v: '20' },
  { i: 2, v: 'none' },
];

export default function ListLayout() {
  return (
    <Svg w={400} h={300} title="A stack slot refers to an ObjList: header fields isMarked and next, then type 'list' and items. items is an array of three values; element 0 refers to a string object.">
      <T x={10} y={12} size={11} weight={700} fill={tok('muted')}>STACK SLOT</T>
      <T x={170} y={12} size={11} weight={700} fill={tok('muted')}>HEAP: ONE ObjList</T>
      <Box x={10} y={28} w={44} h={34} r={4} fill={tok('brand', 0.2)} stroke={tok('brand')}>
        <T x={32} y={45} size={13} mono weight={700} anchor="middle">obj</T>
      </Box>
      <Box x={56} y={28} w={70} h={34} r={4} stroke={tok('ink', 0.5)}>
        <T x={91} y={45} size={12} mono anchor="middle">address</T>
      </Box>
      <Arrow x1={126} y1={45} x2={166} y2={45} />
      {HEADER.map((f, k) => {
        const y = 28 + k * 30;
        const head = k < 2;
        return (
          <Box key={f.k} x={168} y={y} w={224} h={28} r={3} fill={head ? tok('accent', 0.12) : tok('brand', 0.08)} stroke={head ? tok('accent') : tok('brand')}>
            <T x={178} y={y + 14} size={13} mono weight={700}>{f.k}</T>
            <T x={268} y={y + 14} size={13} mono fill={tok('muted')}>{f.v}</T>
          </Box>
        );
      })}
      <T x={10} y={92} size={11} fill={tok('accent')}>header, as on</T>
      <T x={10} y={106} size={11} fill={tok('accent')}>every object</T>
      <Arrow x1={200} y1={142} x2={200} y2={168} />
      <T x={168} y={160} size={11} fill={tok('muted')}>items</T>
      <T x={214} y={160} size={11} fill={tok('muted')}>(a JavaScript array of Values)</T>
      {CELLS.map((c) => {
        const x = 168 + c.i * 76;
        return (
          <g key={c.i}>
            <Box x={x} y={172} w={72} h={36} r={3} stroke={tok('ink', 0.5)}>
              <T x={x + 36} y={190} size={14} mono anchor="middle">{c.v}</T>
            </Box>
            <T x={x + 36} y={220} size={11} mono anchor="middle" fill={tok('muted')}>[{c.i}]</T>
          </g>
        );
      })}
      <Arrow x1={204} y1={208} x2={150} y2={262} />
      <Box x={40} y={252} w={110} h={36} r={6} fill={tok('brand', 0.12)} stroke={tok('brand')}>
        <T x={95} y={270} size={13} mono anchor="middle">"tea"</T>
      </Box>
      <T x={168} y={262} size={11} fill={tok('muted')}>element 0 is an object, so the</T>
      <T x={168} y={277} size={11} fill={tok('muted')}>cell holds one more reference</T>
    </Svg>
  );
}
