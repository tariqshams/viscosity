// Chapter 361: where the emitter's facts live. Real values from lowering
//   const ps = [];
//   for (let i = 0; i < 100; i++) ps.push({ x: i, vx: 1 });
//   for (let i = 0; i < ps.length; i++) ps[i].x += ps[i].vx;
// with JsPlugin.lower (engine/rust, 0.0.1): instruction %19 (index.get for
// the first ps[i] on line 3) has src.node = NodeRef(4), and
// extra.nodes[4] is JsNode::Member { object: 107..109, property: 110..111,
// simple_property: true, direct: true }. Spans are UTF-8 byte offsets.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

export default function SideTable() {
  return (
    <Svg w={400} h={240} title="An instruction's source reference holds a NodeRef, an index into the side table of JsNode facts">
      <Box x={8} y={8} w={180} h={86} fill={tok('brand', 0.12)} stroke={tok('brand')}>
        <T x={18} y={26} size={12} mono weight={700}>%19 = index.get</T>
        <T x={18} y={46} size={11} mono>src.node: NodeRef(4)</T>
        <T x={18} y={64} size={11} mono>src: 107..112</T>
        <T x={18} y={82} size={11} mono>line 3</T>
      </Box>
      <T x={300} y={20} size={11} weight={700} anchor="middle" fill={tok('accent')}>extra.nodes: Vec&lt;JsNode&gt;</T>
      {['0 Plain', '1 Object', '2 Call', '3 Member', '4 Member'].map((l, k) => {
        const y = 30 + k * 24;
        const on = k === 4;
        return (
          <Box key={l} x={226} y={y} w={148} h={20} r={3} fill={on ? tok('accent', 0.18) : tok('panel')} stroke={on ? tok('accent') : tok('line')}>
            <T x={236} y={y + 10} size={11} mono>{l}</T>
          </Box>
        );
      })}
      <Arrow x1={188} y1={46} x2={224} y2={136} color={tok('accent')} width={1.6} />
      <Box x={8} y={176} w={384} h={56} fill={tok('accent', 0.08)} stroke={tok('accent')}>
        <T x={18} y={194} size={11} mono>Member {'{'} object: 107..109 (ps),</T>
        <T x={18} y={212} size={11} mono>  property: 110..111 (i), direct: true {'}'}</T>
      </Box>
      <Arrow x1={300} y1={148} x2={300} y2={174} color={tok('accent')} width={1.6} />
      <T x={8} y={130} size={11} fill={tok('muted')}>ps[i] in ps[i].x</T>
      <T x={8} y={148} size={11} fill={tok('muted')}>no AST is kept</T>
    </Svg>
  );
}
