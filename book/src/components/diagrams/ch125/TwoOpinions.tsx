// let total: number = "3": the declared type (from the annotation) and
// the computed type (from typeOf on the value) meet in one comparison.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

export default function TwoOpinions() {
  return (
    <Svg w={400} h={196} title='The line let total: number = "3". An arrow from the annotation number leads to a box, declared: number. An arrow from the value "3" leads through typeOf to a box, computed: string. Both lead to a comparison, which fails: declared as number, but its value is a string.'>
      <T x={200} y={18} size={15} mono anchor="middle">
        let total: <tspan fill={tok('brand')} fontWeight={700}>number</tspan> = <tspan fill={tok('accent')} fontWeight={700}>"3"</tspan>;
      </T>
      <Arrow x1={180} y1={30} x2={100} y2={62} color={tok('brand')} />
      <Arrow x1={262} y1={30} x2={300} y2={62} color={tok('accent')} />
      <Box x={30} y={66} w={140} h={44} stroke={tok('brand')} fill={tok('brand', 0.08)}>
        <T x={100} y={80} size={11} anchor="middle" fill={tok('muted')}>declared (the label)</T>
        <T x={100} y={98} size={14} mono anchor="middle" weight={700}>number</T>
      </Box>
      <Box x={230} y={66} w={140} h={44} stroke={tok('accent')} fill={tok('accent', 0.08)}>
        <T x={300} y={80} size={11} anchor="middle" fill={tok('muted')}>computed by typeOf</T>
        <T x={300} y={98} size={14} mono anchor="middle" weight={700}>string</T>
      </Box>
      <Arrow x1={100} y1={112} x2={176} y2={136} color={tok('ink', 0.6)} />
      <Arrow x1={300} y1={112} x2={224} y2={136} color={tok('ink', 0.6)} />
      <Box x={150} y={138} w={100} h={26} stroke={tok('danger')} fill={tok('danger', 0.08)}>
        <T x={200} y={151} size={13} anchor="middle" weight={700} fill={tok('danger')}>same? no</T>
      </Box>
      <T x={200} y={184} size={12} anchor="middle" fill={tok('danger')}>'total' is declared as number, but its value is a string</T>
    </Svg>
  );
}
