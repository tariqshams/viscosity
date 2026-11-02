import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 266: two fat pointers, as rustc 1.97 and Go 1.24 lay them out
// (observed in their assembly; see the chapter). In both, the method the
// chapter calls sits 24 bytes into the table.
function Pair({ y, a, b, label }: { y: number; a: string; b: string; label: string }) {
  return (
    <g>
      <T x={4} y={y - 10} size={11} weight={700} fill={tok('muted')}>{label}</T>
      <Box x={4} y={y} w={70} h={30} fill={tok('brand', 0.12)} stroke={tok('brand')}>
        <T x={39} y={y + 15} size={12} mono anchor="middle">{a}</T>
      </Box>
      <Box x={74} y={y} w={70} h={30} fill={tok('brand', 0.12)} stroke={tok('brand')}>
        <T x={109} y={y + 15} size={12} mono anchor="middle">{b}</T>
      </Box>
    </g>
  );
}
function Table({ x, y, rows }: { x: number; y: number; rows: string[] }) {
  return (
    <g>
      {rows.map((r, k) => (
        <Box key={k} x={x} y={y + k * 22} w={190} h={22} fill={k === 3 ? tok('warn', 0.15) : tok('panel')}>
          <T x={x + 6} y={y + 11 + k * 22} size={11} mono fill={tok('muted')}>+{k * 8}</T>
          <T x={x + 34} y={y + 11 + k * 22} size={11} mono>{r}</T>
        </Box>
      ))}
    </g>
  );
}

export default function FatPointerFigure() {
  return (
    <Svg w={400} h={262} title="A Rust &dyn Area is a data pointer and a vtable pointer; a Go interface value is an itab pointer and a data pointer. Both tables hold the area method 24 bytes in.">
      <Pair y={22} a="data" b="vtable" label="RUST: &dyn Area (two words)" />
      <Box x={4} y={70} w={110} h={26}>
        <T x={59} y={83} size={12} mono anchor="middle">Sq(2.0)</T>
      </Box>
      <Arrow x1={39} y1={52} x2={39} y2={70} />
      <Table x={204} y={14} rows={['drop: (none)', 'size: 8', 'align: 8', 'area']} />
      <Arrow x1={144} y1={37} x2={204} y2={25} />
      <Pair y={146} a="tab" b="data" label="GO: Shape" />
      <Box x={74} y={194} w={110} h={26}>
        <T x={129} y={207} size={12} mono anchor="middle">Sq{'{2}'}</T>
      </Box>
      <Arrow x1={109} y1={176} x2={109} y2={194} />
      <Table x={204} y={138} rows={['Inter: Shape', 'Type: Sq', 'Hash', 'Fun[0]: Area']} />
      <Arrow x1={39} y1={146} x2={204} y2={149} bend={-0.4} />
      <T x={4} y={252} size={11} fill={tok('muted')}>Highlighted: the slot each call reads, 24 bytes in.</T>
    </Svg>
  );
}
