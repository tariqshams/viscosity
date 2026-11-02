// Chapter 359: what travels where in viscosity_core::compile
// (engine/rust/crates/core/src/lib.rs). plugin.lower returns a
// LoweredModule<P::Extra>; the core reads only .module (analyze) and
// .annotations (the plan options); .extra goes straight from lower to
// plugin.emit; CompileResult (code, plan, analysis, explain) has no Extra.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

export default function ExtraRoute() {
  return (
    <Svg w={400} h={262} title="The plugin's lower produces a module, annotations and extra data; the core reads the first two, and the extra data goes past the core straight to the plugin's emit">
      <Box x={8} y={8} w={110} h={34} fill={tok('accent', 0.14)} stroke={tok('accent')}>
        <T x={63} y={25} size={12} mono anchor="middle">plugin.lower</T>
      </Box>
      <Arrow x1={120} y1={25} x2={146} y2={25} />
      <Box x={150} y={8} w={242} h={92} fill={tok('panel')} stroke={tok('ink', 0.5)}>
        <T x={160} y={24} size={11} mono weight={700}>LoweredModule&lt;P::Extra&gt;</T>
        <T x={170} y={46} size={11} mono>module</T>
        <T x={170} y={66} size={11} mono>annotations</T>
        <T x={170} y={86} size={11} mono fill={tok('accent')}>extra: P::Extra</T>
      </Box>
      <Arrow x1={230} y1={56} x2={110} y2={122} color={tok('brand')} />
      <Box x={8} y={124} w={190} h={48} fill={tok('brand', 0.14)} stroke={tok('brand')}>
        <T x={103} y={141} size={12} weight={700} anchor="middle">core: analyze, plan</T>
        <T x={103} y={159} size={11} anchor="middle" fill={tok('muted')}>sees only VIR</T>
      </Box>
      <Arrow x1={300} y1={92} x2={300} y2={190} color={tok('accent')} dash />
      <T x={308} y={140} size={11} fill={tok('accent')}>past the core</T>
      <Arrow x1={110} y1={174} x2={240} y2={196} color={tok('brand')} />
      <T x={140} y={198} size={11} mono anchor="end" fill={tok('brand')}>plan</T>
      <Box x={244} y={192} w={148} h={34} fill={tok('accent', 0.14)} stroke={tok('accent')}>
        <T x={318} y={209} size={12} mono anchor="middle">plugin.emit</T>
      </Box>
      <T x={200} y={248} size={11} anchor="middle" fill={tok('muted')}>CompileResult: code, plan, analysis, explain; no Extra</T>
    </Svg>
  );
}
