import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 438b: a profile is keyed by collection name. This chapter's
// two.js has a() building a ps of 1000 records and b() a ps of 10. The
// profile `viscosity profile two.js` wrote (rustc 1.97 release build) has
// one entry, "ps": { "maxLength": 1000 }, and with it explain reports
// "about 1000 elements (measured by profiling)" for both collections.
export default function KeyedByName() {
  return (
    <Svg w={400} h={200} title="Two collections named ps share one profile entry, the larger length">
      <Box x={4} y={8} w={150} h={50} fill={tok('brand', 0.08)} stroke={tok('brand')}>
        <T x={12} y={24} size={11} mono weight={700}>function a()</T>
        <T x={12} y={42} size={11} mono>ps: 1000 elements</T>
      </Box>
      <Box x={4} y={76} w={150} h={50} fill={tok('brand', 0.08)} stroke={tok('brand')}>
        <T x={12} y={92} size={11} mono weight={700}>function b()</T>
        <T x={12} y={110} size={11} mono>ps: 10 elements</T>
      </Box>
      <Arrow x1={156} y1={33} x2={222} y2={60} />
      <Arrow x1={156} y1={101} x2={222} y2={74} />
      <Box x={224} y={44} w={172} h={46} fill={tok('safe', 0.1)} stroke={tok('safe')}>
        <T x={232} y={60} size={11} mono>"ps": {"{"}</T>
        <T x={232} y={78} size={11} mono>  "maxLength": 1000 {"}"}</T>
      </Box>
      <T x={232} y={104} size={11} fill={tok('muted')}>max of both, one key</T>
      <Box x={4} y={142} w={392} h={50} fill={tok('warn', 0.1)} stroke={tok('warn')}>
        <T x={12} y={158} size={11} fill={tok('muted')}>explain two.js --profile two.json, for both:</T>
        <T x={12} y={178} size={11} mono>· about 1000 elements (measured by profiling)</T>
      </Box>
    </Svg>
  );
}
