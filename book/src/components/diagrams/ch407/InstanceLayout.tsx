// Chapter 407: what one drip-rs instance holds, for
//   let p = new Point(); p.x = 3; p.y = 4; p.x = 5;
// ObjInstance { class: Gc<ObjClass>, fields: Table, field_order:
// Vec<StrRef> } from book/companion/rust/src/object.rs; Table keeps its
// keys and values in two Vecs (src/table.rs). The sizes were printed with
// std::mem::size_of on rustc 1.97, x86-64 Linux: ObjInstance 88 bytes,
// Table 56, Gc 4. The table's slot order is drawn for illustration (it
// depends on the names' hashes); field_order is the real print order.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

export default function InstanceLayout() {
  return (
    <Svg w={400} h={232} title="An instance holds a handle to its class, a field table with keys and values in two columns, and the field names in the order they were first set">
      <T x={8} y={14} size={12} weight={700}>heap.instances[0]: an ObjInstance (88 bytes)</T>
      <Box x={8} y={26} w={384} h={30} r={4} fill={tok('panel')} stroke={tok('brand')}>
        <T x={16} y={41} size={11} mono>class: Gc(0)</T>
        <T x={132} y={41} size={11} mono>fields: Table</T>
        <T x={262} y={41} size={11} mono>field_order</T>
      </Box>
      <Arrow x1={50} y1={56} x2={50} y2={90} color={tok('accent')} />
      <Box x={8} y={92} w={100} h={30} r={4}>
        <T x={16} y={107} size={11} mono>class Point</T>
      </Box>

      <T x={132} y={80} size={11} fill={tok('muted')}>keys</T>
      <T x={200} y={80} size={11} fill={tok('muted')}>values</T>
      {[['None', ''], ['"y"', '4'], ['"x"', '5'], ['None', '']].map(([k, v], i) => (
        <g key={i}>
          <Box x={132} y={88 + i * 26} w={60} h={22} r={2} fill={k === 'None' ? tok('paper') : tok('brand', 0.1)} stroke={tok('line')}>
            <T x={162} y={99 + i * 26} size={11} mono anchor="middle" fill={k === 'None' ? tok('muted') : tok('ink')}>{k}</T>
          </Box>
          <Box x={196} y={88 + i * 26} w={44} h={22} r={2} fill={v ? tok('brand', 0.1) : tok('paper')} stroke={tok('line')}>
            <T x={218} y={99 + i * 26} size={11} mono anchor="middle">{v}</T>
          </Box>
        </g>
      ))}

      {['"x"', '"y"'].map((k, i) => (
        <Box key={k} x={262 + i * 52} y={88} w={46} h={22} r={2} fill={tok('safe', 0.15)} stroke={tok('safe')}>
          <T x={285 + i * 52} y={99} size={11} mono anchor="middle">{k}</T>
        </Box>
      ))}
      <T x={262} y={128} size={11} fill={tok('muted')}>first set: x, then y</T>
      <T x={262} y={144} size={11} fill={tok('muted')}>(p.x = 5 did not move x)</T>

      <T x={8} y={208} size={11} fill={tok('muted')}>prints as  Point {'{'} x: 5, y: 4 {'}'}</T>
      <T x={8} y={224} size={11} fill={tok('muted')}>table: what is x?   field_order: in what order?</T>
    </Svg>
  );
}
