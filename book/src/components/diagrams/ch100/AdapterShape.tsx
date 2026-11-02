import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 100b: the JavaScript plugin's parsing step
// (frontend-js/src/index.ts). TypeScript goes through sucrase first; then
// acorn (the default) or the hand-written mini parser produce the ESTree
// slice described in estree.ts, plus the comments; everything after that
// (resolveScopes, lower, the annotation matching) sees only ESTree.
export default function AdapterShape() {
  return (
    <Svg w={400} h={300} title="TypeScript is stripped by sucrase, then either acorn or the mini parser produces ESTree and comments, which is all the rest of the plugin sees">
      <Box x={8} y={8} w={110} h={36}><T x={63} y={26} size={12} mono anchor="middle">app.ts</T></Box>
      <Arrow x1={118} y1={26} x2={146} y2={26} />
      <Box x={146} y={8} w={110} h={36} fill={tok('f4', 0.12)} stroke={tok('f4')}><T x={201} y={26} size={12} anchor="middle">sucrase</T></Box>
      <T x={264} y={20} size={11} fill={tok('muted')}>strips types,</T>
      <T x={264} y={34} size={11} fill={tok('muted')}>keeps the rest</T>
      <Box x={8} y={58} w={110} h={36}><T x={63} y={76} size={12} mono anchor="middle">app.js</T></Box>
      <Arrow x1={201} y1={44} x2={160} y2={104} />
      <Arrow x1={63} y1={94} x2={110} y2={104} />

      <Box x={8} y={104} w={384} h={66} fill="transparent" stroke={tok('brand')} dash>
        <T x={200} y={118} size={11} weight={700} anchor="middle" fill={tok('brand')}>THE ADAPTER: one of two parsers</T>
        <Box x={24} y={128} w={160} h={34} fill={tok('brand', 0.12)} stroke={tok('brand')}><T x={104} y={145} size={12} anchor="middle">acorn (default)</T></Box>
        <Box x={216} y={128} w={160} h={34} fill={tok('accent', 0.12)} stroke={tok('accent')}><T x={296} y={145} size={12} anchor="middle">mini parser</T></Box>
      </Box>
      <Arrow x1={140} y1={170} x2={140} y2={196} />
      <Arrow x1={260} y1={170} x2={260} y2={196} />
      <Box x={60} y={196} w={140} h={36} fill={tok('panel')}><T x={130} y={214} size={12} anchor="middle">ESTree + offsets</T></Box>
      <Box x={210} y={196} w={130} h={36} fill={tok('panel')}><T x={275} y={214} size={12} anchor="middle">comments</T></Box>
      <Arrow x1={130} y1={232} x2={130} y2={254} />
      <Arrow x1={275} y1={232} x2={275} y2={254} />
      <Box x={60} y={254} w={140} h={36} fill={tok('f3', 0.12)} stroke={tok('f3')}><T x={130} y={272} size={12} anchor="middle">resolve, lower</T></Box>
      <Box x={210} y={254} w={130} h={36} fill={tok('f3', 0.12)} stroke={tok('f3')}><T x={275} y={272} size={12} anchor="middle">@viscosity</T></Box>
    </Svg>
  );
}
