import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 311: how a procedural macro takes part in a build. The
// Rust Reference: proc macros live in a proc-macro crate, "run during
// compilation", and operate on token streams. The order (macro crate
// first, then the crate that uses it) is what cargo did in the
// chapter's scratch workspace.
export default function ProcMacroPipeline() {
  return (
    <Svg w={400} h={232} title="cargo compiles the proc-macro crate first; rustc loads it while expanding the app crate, sending tokens in and getting tokens back">
      <Box x={8} y={8} w={180} h={56} fill={tok('f2', 0.12)} stroke={tok('f2')}>
        <T x={18} y={28} size={12} weight={700}>describe (proc-macro)</T>
        <T x={18} y={48} size={11} mono>syn, quote</T>
      </Box>
      <Arrow x1={98} y1={64} x2={98} y2={92} />
      <T x={108} y={80} size={11} fill={tok('muted')}>compiled first</T>
      <Box x={8} y={94} w={384} h={84} fill={tok('panel')} stroke={tok('line')}>
        <T x={18} y={112} size={12} weight={700}>rustc, building app</T>
        <Box x={18} y={124} w={110} h={42} r={4} fill={tok('f1', 0.1)} stroke={tok('f1')}>
          <T x={73} y={140} size={11} anchor="middle">scan, match</T>
          <T x={73} y={155} size={11} anchor="middle">brackets</T>
        </Box>
        <Box x={146} y={124} w={110} h={42} r={4} fill={tok('f2', 0.18)} stroke={tok('f2')}>
          <T x={201} y={140} size={11} anchor="middle">expand: run</T>
          <T x={201} y={155} size={11} anchor="middle">describe()</T>
        </Box>
        <Box x={274} y={124} w={108} h={42} r={4} fill={tok('panel')} stroke={tok('line')}>
          <T x={328} y={140} size={11} anchor="middle">types, borrows,</T>
          <T x={328} y={155} size={11} anchor="middle">codegen</T>
        </Box>
        <Arrow x1={128} y1={145} x2={146} y2={145} />
        <Arrow x1={256} y1={145} x2={274} y2={145} />
      </Box>
      <Arrow x1={160} y1={64} x2={196} y2={124} color={tok('f2')} dash />
      <T x={8} y={198} size={11} mono fill={tok('muted')}>TokenStream in  →  TokenStream out</T>
      <T x={8} y={218} size={11} fill={tok('muted')}>the macro sees tokens only, before any types exist</T>
    </Svg>
  );
}
