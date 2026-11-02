import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 312: the build of the scratch project callc. build.rs runs
// the cc crate, which compiles c/stats.c into libstats.a in cargo's
// OUT_DIR (observed: target/debug/build/*/out/libstats.a); rustc
// compiles main.rs; the linker joins them on the symbol name mean.
export default function LinkFigure() {
  return (
    <Svg w={400} h={226} title="stats.c is compiled by cc into libstats.a, main.rs by rustc into an object file, and the linker joins them into one program">
      <Box x={8} y={8} w={180} h={40} fill={tok('f3', 0.12)} stroke={tok('f3')}>
        <T x={98} y={28} size={12} mono anchor="middle">c/stats.c</T>
      </Box>
      <Box x={212} y={8} w={180} h={40} fill={tok('f1', 0.12)} stroke={tok('f1')}>
        <T x={302} y={28} size={12} mono anchor="middle">src/main.rs</T>
      </Box>
      <Arrow x1={98} y1={48} x2={98} y2={78} />
      <T x={106} y={64} size={11} fill={tok('muted')}>build.rs → cc</T>
      <Arrow x1={302} y1={48} x2={302} y2={78} />
      <T x={310} y={64} size={11} fill={tok('muted')}>rustc</T>
      <Box x={8} y={80} w={180} h={48} fill={tok('panel')} stroke={tok('line')}>
        <T x={98} y={98} size={12} mono anchor="middle">libstats.a</T>
        <T x={98} y={116} size={11} anchor="middle" fill={tok('muted')}>defines: mean</T>
      </Box>
      <Box x={212} y={80} w={180} h={48} fill={tok('panel')} stroke={tok('line')}>
        <T x={302} y={98} size={12} mono anchor="middle">main's object file</T>
        <T x={302} y={116} size={11} anchor="middle" fill={tok('muted')}>needs: mean</T>
      </Box>
      <Arrow x1={98} y1={128} x2={180} y2={162} />
      <Arrow x1={302} y1={128} x2={220} y2={162} />
      <Box x={110} y={164} w={180} h={50} fill={tok('safe', 0.1)} stroke={tok('safe')}>
        <T x={200} y={182} size={12} weight={700} anchor="middle">linker</T>
        <T x={200} y={200} size={11} anchor="middle">matches the name mean</T>
      </Box>
    </Svg>
  );
}
