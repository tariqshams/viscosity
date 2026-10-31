import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

/** A function as a machine: a value goes in, the body does work, a value comes out. */
export default function FunctionMachine() {
  return (
    <Svg w={400} h={230} title="The function double: the argument 3 goes in through the parameter n, the body computes n times 2, and 6 comes out as the return value.">
      {/* input */}
      <T x={60} y={22} size={12} weight={700} anchor="middle" fill={tok('muted')}>ARGUMENT</T>
      <Box x={35} y={34} w={50} h={36} fill={tok('f1', 0.18)} stroke={tok('f1')}>
        <T x={60} y={52} size={18} mono weight={700} anchor="middle">3</T>
      </Box>
      <Arrow x1={60} y1={72} x2={60} y2={104} />
      {/* machine */}
      <Box x={20} y={106} w={360} h={70} fill={tok('panel')} stroke={tok('ink', 0.6)} r={8}>
        <T x={34} y={124} size={12} weight={700} fill={tok('muted')}>function double(</T>
        <Box x={135} y={113} w={26} h={22} fill={tok('f1', 0.18)} stroke={tok('f1')} r={4}>
          <T x={148} y={124.5} size={13} mono weight={700} anchor="middle">n</T>
        </Box>
        <T x={164} y={124} size={12} weight={700} fill={tok('muted')}>)</T>
        <T x={38} y={156} size={16} mono>return n * 2;</T>
        <T x={366} y={124} size={11} anchor="end" fill={tok('muted')}>the body: the work</T>
      </Box>
      <T x={148} y={98} size={11} anchor="middle" fill={tok('f1')} weight={600}>PARAMETER n = 3</T>
      {/* output */}
      <Arrow x1={300} y1={178} x2={300} y2={202} color={tok('brand')} />
      <Box x={275} y={196} w={50} h={32} fill={tok('brand', 0.18)} stroke={tok('brand')}>
        <T x={300} y={212} size={18} mono weight={700} anchor="middle">6</T>
      </Box>
      <T x={262} y={212} size={12} weight={700} anchor="end" fill={tok('brand')}>RETURN VALUE</T>
    </Svg>
  );
}
