import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 274: the prefix rule for single inheritance. A subclass keeps
// its parent's fields at the same offsets and its parent's methods in the
// same vtable slots, adding its own after them.
const OBJ = [
  { label: 'Sq', cells: ['vptr', 's'] },
  { label: 'BigSq', cells: ['vptr', 's', 'tag'] },
];
const VT = [
  { label: 'Sq vtable', cells: ['area', 'name'] },
  { label: 'BigSq vtable', cells: ['area', 'name', 'grow'] },
];

export default function LayoutFigure() {
  return (
    <Svg w={400} h={232} title="A Sq object holds vptr then s; a BigSq object holds vptr, s, then tag. Their vtables hold area and name, and BigSq's adds grow after them.">
      <T x={4} y={12} size={11} weight={700} fill={tok('muted')}>OBJECTS (8 bytes a cell)</T>
      {OBJ.map((o, k) => (
        <g key={o.label}>
          <T x={4} y={42 + k * 44} size={12} weight={700}>{o.label}</T>
          {o.cells.map((c, j) => (
            <Box key={c} x={70 + j * 80} y={26 + k * 44} w={80} h={32}
              fill={j < 2 ? tok('panel') : tok('brand', 0.15)}
              stroke={j < 2 ? tok('ink', 0.5) : tok('brand')}>
              <T x={110 + j * 80} y={42 + k * 44} size={12} mono anchor="middle">{c}</T>
            </Box>
          ))}
        </g>
      ))}
      {[0, 8, 16].map((off, j) => (
        <T key={off} x={110 + j * 80} y={112} size={11} mono anchor="middle" fill={tok('muted')}>+{off}</T>
      ))}
      <T x={4} y={136} size={11} weight={700} fill={tok('muted')}>VTABLES (one slot a method)</T>
      {VT.map((o, k) => (
        <g key={o.label}>
          <T x={4} y={166 + k * 40} size={11} weight={700}>{k ? 'BigSq' : 'Sq'}</T>
          {o.cells.map((c, j) => (
            <Box key={c} x={70 + j * 80} y={150 + k * 40} w={80} h={30}
              fill={j < 2 ? tok('panel') : tok('brand', 0.15)}
              stroke={j < 2 ? tok('ink', 0.5) : tok('brand')}>
              <T x={110 + j * 80} y={165 + k * 40} size={12} mono anchor="middle">{j}: {c}</T>
            </Box>
          ))}
        </g>
      ))}
      <Arrow x1={340} y1={74} x2={340} y2={196} color={tok('brand')} dash />
      <T x={348} y={136} size={11} fill={tok('brand')}>new</T>
      <T x={348} y={150} size={11} fill={tok('brand')}>things</T>
      <T x={348} y={164} size={11} fill={tok('brand')}>go last</T>
    </Svg>
  );
}
