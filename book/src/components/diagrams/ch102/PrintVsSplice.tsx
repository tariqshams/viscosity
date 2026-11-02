import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 102: two ways back to text. The spliced output is Viscosity's
// real `viscosity build` output for the input shown (the comment and the
// odd spacing survive). The printed output is an illustration of what a
// printer that walks a rebuilt tree would write: comments are not in the
// tree, and spacing is the printer's own.
export default function PrintVsSplice() {
  return (
    <Svg w={400} h={300} title="The same input turned back into text two ways: printing from a tree loses the comment and the spacing; splicing edits into the original keeps them">
      <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>INPUT</T>
      <Box x={8} y={20} w={384} h={44} fill={tok('panel')}>
        <T x={16} y={35} size={11} mono fill={tok('safe')}>// move every particle</T>
        <T x={16} y={52} size={11} mono>{'for (const p of ps) p.x   +=   p.vx;'}</T>
      </Box>
      <Arrow x1={100} y1={64} x2={100} y2={92} />
      <Arrow x1={300} y1={64} x2={300} y2={92} />

      <T x={8} y={104} size={11} weight={700} fill={tok('danger')}>PRINT A NEW TREE</T>
      <T x={8} y={120} size={11} fill={tok('muted')}>(an illustration)</T>
      <Box x={8} y={130} w={186} h={110} fill={tok('danger', 0.06)} stroke={tok('danger')}>
        <T x={16} y={148} size={11} mono>{'for (let p = 0;'}</T>
        <T x={16} y={164} size={11} mono>{'    p < ps.length;'}</T>
        <T x={16} y={180} size={11} mono>{'    p++) {'}</T>
        <T x={16} y={196} size={11} mono>{'  ps.x[p] += ps.vx[p];'}</T>
        <T x={16} y={212} size={11} mono>{'}'}</T>
        <T x={16} y={230} size={11} fill={tok('danger')}>comment gone, spacing new</T>
      </Box>

      <T x={206} y={104} size={11} weight={700} fill={tok('safe')}>SPLICE EDITS (Viscosity)</T>
      <T x={206} y={120} size={11} fill={tok('muted')}>(real output)</T>
      <Box x={206} y={130} w={186} h={110} fill={tok('safe', 0.06)} stroke={tok('safe')}>
        <T x={214} y={148} size={11} mono fill={tok('safe')}>// move every particle</T>
        <T x={214} y={164} size={11} mono>{'for (let p = 0;'}</T>
        <T x={214} y={180} size={11} mono>{'  p < ps.length; p++)'}</T>
        <T x={214} y={196} size={11} mono>{'  ps.x[p]   +='}</T>
        <T x={214} y={212} size={11} mono>{'    ps.vx[p];'}</T>
        <T x={214} y={230} size={11} fill={tok('safe')}>comment and spacing kept</T>
      </Box>
      <T x={200} y={266} size={11} anchor="middle" fill={tok('muted')}>The spliced line is one line in the real output;</T>
      <T x={200} y={282} size={11} anchor="middle" fill={tok('muted')}>it is wrapped here to fit.</T>
    </Svg>
  );
}
