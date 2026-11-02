import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 244: the shape of the control-flow graph that the JavaScript
// plugin builds for
//   const ps = [{ x: 1, vx: 2 }]; let t = 0;
//   for (let i = 0; i < ps.length; i++) t = t + ps[i].x * ps[i].vx;
//   console.log(t);
// Blocks and edges are those of the real printFunc listing (b0 to b4).
const B = ({ x, y, id, lines, hl }: { x: number; y: number; id: string; lines: string[]; hl?: boolean }) => (
  <Box x={x} y={y} w={160} h={20 + lines.length * 16} fill={hl ? tok('brand', 0.12) : tok('panel')} stroke={hl ? tok('brand') : tok('line')}>
    <T x={x + 8} y={y + 12} size={11} mono weight={700} fill={hl ? tok('brand') : undefined}>{id}</T>
    {lines.map((l, k) => <T key={k} x={x + 8} y={y + 28 + k * 16} size={11} mono>{l}</T>)}
  </Box>
);

export default function CfgShape() {
  return (
    <Svg w={400} h={310} title="The control-flow graph of a for loop: an entry block, a loop header with two phis, a body, a continue block and an exit">
      <B x={40} y={8} id="b0  entry" lines={['ps = [record]', 't₀ = 0, i₀ = 0']} />
      <Arrow x1={120} y1={60} x2={120} y2={82} />
      <B x={40} y={82} id="b1  loop header" hl lines={['t₁ = phi t₀, t₂', 'i₁ = phi i₀, i₂', 'condbr i₁ < length']} />
      <Arrow x1={120} y1={150} x2={120} y2={176} />
      <T x={128} y={164} size={11} fill={tok('safe')}>true</T>
      <B x={40} y={176} id="b2  body" lines={['t₂ = t₁ + x·vx']} />
      <Arrow x1={120} y1={212} x2={120} y2={236} />
      <B x={40} y={236} id="b3  continue" lines={['i₂ = i₁ + 1', 'br b1']} />
      <Arrow x1={40} y1={262} x2={40} y2={112} bend={-0.6} color={tok('accent')} />
      <T x={40} y={302} size={11} fill={tok('accent')}>back edge: b3 → b1</T>
      <Arrow x1={200} y1={130} x2={232} y2={130} />
      <T x={202} y={120} size={11} fill={tok('danger')}>false</T>
      <B x={232} y={110} id="b4  exit" lines={['console.log(t₁)', 'return']} />
      <T x={232} y={196} size={11} fill={tok('muted')}>Every block ends in one</T>
      <T x={232} y={212} size={11} fill={tok('muted')}>terminator: br, condbr,</T>
      <T x={232} y={228} size={11} fill={tok('muted')}>return, throw or</T>
      <T x={232} y={244} size={11} fill={tok('muted')}>unreachable.</T>
      <T x={232} y={276} size={11} fill={tok('muted')}>Phis sit where paths</T>
      <T x={232} y={292} size={11} fill={tok('muted')}>meet: the loop header.</T>
    </Svg>
  );
}
