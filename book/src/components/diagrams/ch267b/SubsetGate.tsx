import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 267 (second half): what pythonPlugin().lower does with a file
// (frontend-python/src/index.ts). Inside the subset it lowers to VIR as
// usual; outside it, the PySyntaxError is caught, an empty module is
// returned, and emit hands back the source unchanged.
export default function SubsetGate() {
  return (
    <Svg w={400} h={236} title="A Python file goes to parsePython. If every construct is in the subset, it is lowered to VIR and analysed, and the output may be transformed. If any construct is outside the subset, a PySyntaxError is caught, the plugin returns an empty module, and emit returns the file exactly as it was; explain then says No arrays of objects found.">
      <Box x={140} y={6} w={120} h={30} fill={tok('panel')}>
        <T x={200} y={21} size={13} mono anchor="middle">file.py</T>
      </Box>
      <Arrow x1={200} y1={36} x2={200} y2={56} />
      <Box x={110} y={58} w={180} h={32} fill={tok('brand', 0.12)} stroke={tok('brand')}>
        <T x={200} y={74} size={12} mono anchor="middle">parsePython(source)</T>
      </Box>
      <Arrow x1={160} y1={90} x2={90} y2={122} />
      <Arrow x1={240} y1={90} x2={310} y2={122} />
      <T x={70} y={104} size={11} fill={tok('safe')} weight={700}>all in the subset</T>
      <T x={262} y={104} size={11} fill={tok('f6')} weight={700}>anything outside</T>
      <Box x={6} y={124} w={186} h={66} fill={tok('safe', 0.12)} stroke={tok('safe')}>
        <T x={16} y={142} size={12} mono>lowerPython → VIR</T>
        <T x={16} y={162} size={12}>analyse, plan, emit:</T>
        <T x={16} y={180} size={12}>may be transformed</T>
      </Box>
      <Box x={208} y={124} w={186} h={66} fill={tok('f6', 0.12)} stroke={tok('f6')}>
        <T x={218} y={142} size={12} mono>catch PySyntaxError</T>
        <T x={218} y={162} size={12}>empty module; emit</T>
        <T x={218} y={180} size={12}>returns the source</T>
      </Box>
      <T x={301} y={208} size={11} anchor="middle" fill={tok('muted')}>explain: No arrays of</T>
      <T x={301} y={224} size={11} anchor="middle" fill={tok('muted')}>objects found.</T>
      <T x={99} y={208} size={11} anchor="middle" fill={tok('muted')}>never half-transformed:</T>
      <T x={99} y={224} size={11} anchor="middle" fill={tok('muted')}>all of the file, or none</T>
    </Svg>
  );
}
