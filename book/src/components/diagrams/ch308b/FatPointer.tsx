import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// A thin reference is one address; a trait object reference is two: the
// address of the value and the address of the vtable for its type. Sizes
// are what rustc 1.97 printed on this machine (x86-64).

export default function FatPointer() {
  return (
    <Svg w={400} h={200} title="A thin reference of 8 bytes beside a fat trait-object reference of 16 bytes, pointing at a value and a vtable">
      <T x={6} y={14} size={11} weight={700} fill={tok('muted')}>&amp;Js: 8 BYTES</T>
      <Box x={6} y={24} w={70} h={30} r={3} fill={tok('f1', 0.18)} stroke={tok('f1')}>
        <T x={41} y={39} size={11} mono anchor="middle">addr</T>
      </Box>
      <Box x={240} y={24} w={70} h={30} r={4} fill={tok('panel')} stroke={tok('ink', 0.5)}>
        <T x={275} y={39} size={12} mono anchor="middle">Js</T>
      </Box>
      <Arrow x1={78} y1={39} x2={236} y2={39} color={tok('f1')} />

      <T x={6} y={86} size={11} weight={700} fill={tok('muted')}>&amp;dyn Plugin: 16 BYTES</T>
      <Box x={6} y={96} w={70} h={30} r={3} fill={tok('f1', 0.18)} stroke={tok('f1')}>
        <T x={41} y={111} size={11} mono anchor="middle">data</T>
      </Box>
      <Box x={78} y={96} w={70} h={30} r={3} fill={tok('f3', 0.18)} stroke={tok('f3')}>
        <T x={113} y={111} size={11} mono anchor="middle">vtable</T>
      </Box>
      <Box x={240} y={96} w={70} h={30} r={4} fill={tok('panel')} stroke={tok('ink', 0.5)}>
        <T x={275} y={111} size={12} mono anchor="middle">Py</T>
      </Box>
      <Arrow x1={41} y1={96} x2={236} y2={104} color={tok('f1')} bend={-0.15} />
      <Box x={200} y={140} w={190} h={52} r={4} fill={tok('f3', 0.08)} stroke={tok('f3')}>
        <T x={210} y={155} size={11} mono weight={700}>vtable: Plugin for Py</T>
        <T x={210} y={174} size={11} mono>Py::id, Py::exts, handles</T>
      </Box>
      <Arrow x1={113} y1={126} x2={196} y2={160} color={tok('f3')} bend={0.2} />
    </Svg>
  );
}
