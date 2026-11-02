import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 285: how the CLI routes a file. pluginFor() in
// engine/ts/packages/cli/src/cli.ts picks the plugin by extension; the core
// in between (analyze, plan, explain) is the same for every language.
export default function PluginRoute() {
  return (
    <Svg w={400} h={262} title="Three files, p.js, p.ts and p.py. The first two go to the JavaScript plugin and the third to the Python plugin, chosen by file extension. Both plugins lower into VIR, where the shared core runs analyze, plan and explain. The plan goes back to the same plugin, whose emit writes the output in the file's own language.">
      {[['p.js', 10], ['p.ts', 140], ['p.py', 270]].map(([f, x]) => (
        <Box key={f as string} x={x as number} y={8} w={120} h={28} fill={tok('panel')}>
          <T x={(x as number) + 60} y={22} size={13} mono anchor="middle">{f}</T>
        </Box>
      ))}
      <T x={200} y={50} size={11} anchor="middle" fill={tok('muted')}>pluginFor(file): chosen by the extension</T>
      <Arrow x1={70} y1={36} x2={100} y2={68} />
      <Arrow x1={200} y1={36} x2={160} y2={68} />
      <Arrow x1={330} y1={36} x2={330} y2={68} />
      <Box x={10} y={70} w={250} h={32} fill={tok('f1', 0.15)} stroke={tok('f1')}>
        <T x={135} y={86} size={12} mono anchor="middle">jsPlugin: lower</T>
      </Box>
      <Box x={270} y={70} w={120} h={32} fill={tok('f3', 0.15)} stroke={tok('f3')}>
        <T x={330} y={86} size={12} mono anchor="middle">python: lower</T>
      </Box>
      <Arrow x1={135} y1={102} x2={160} y2={124} />
      <Arrow x1={330} y1={102} x2={260} y2={124} />
      <Box x={10} y={126} w={380} h={58} fill={tok('brand', 0.1)} stroke={tok('brand')}>
        <T x={200} y={144} size={13} weight={700} anchor="middle">VIR → analyze → plan → explain</T>
        <T x={200} y={166} size={11} anchor="middle" fill={tok('muted')}>the shared core: it never sees a brace or an indent</T>
      </Box>
      <Arrow x1={160} y1={184} x2={135} y2={206} />
      <Arrow x1={260} y1={184} x2={330} y2={206} />
      <Box x={10} y={208} w={250} h={32} fill={tok('f1', 0.15)} stroke={tok('f1')}>
        <T x={135} y={224} size={12} mono anchor="middle">jsPlugin: emit → .js</T>
      </Box>
      <Box x={270} y={208} w={120} h={32} fill={tok('f3', 0.15)} stroke={tok('f3')}>
        <T x={330} y={224} size={12} mono anchor="middle">emit → .py</T>
      </Box>
      <T x={200} y={254} size={11} anchor="middle" fill={tok('muted')}>each plugin owns both ends of its own language</T>
    </Svg>
  );
}
