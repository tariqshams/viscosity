import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

function SetBox({ x, y, title, value, hot }: { x: number; y: number; title: string; value: string; hot?: boolean }) {
  return (
    <Box x={x} y={y} w={120} h={44} fill={hot ? tok('brand', 0.12) : tok('panel')} stroke={hot ? tok('brand') : tok('ink', 0.4)}>
      <T x={x + 60} y={y + 14} size={11} weight={700} anchor="middle" fill={tok('muted')}>{title}</T>
      <T x={x + 60} y={y + 31} size={13} mono anchor="middle">{value}</T>
    </Box>
  );
}

/** Where the FOLLOW sets of item and rest come from, in expr → item rest. */
export default function FollowFlow() {
  return (
    <Svg w={400} h={250} title="The rule expr → item rest. FIRST(rest), the plus sign, flows into FOLLOW(item). FOLLOW(expr), the semicolon and closing bracket, flows into FOLLOW(rest), because rest ends the rule, and into FOLLOW(item), because rest can vanish.">
      <T x={200} y={14} size={15} mono anchor="middle" weight={700}>expr → item rest</T>
      <SetBox x={20} y={36} title="FIRST(rest)" value="{ + }" />
      <SetBox x={260} y={36} title="FOLLOW(expr)" value="{ ; ) }" />
      <SetBox x={20} y={198} title="FOLLOW(item)" value="{ + ; ) }" hot />
      <SetBox x={260} y={198} title="FOLLOW(rest)" value="{ ; ) }" hot />
      <Arrow x1={60} y1={82} x2={60} y2={194} color={tok('brand')} />
            <T x={68} y={112} size={11} fill={tok('brand')}>1. rest comes</T>
      <T x={68} y={124} size={11} fill={tok('brand')}>after item</T>
      <Arrow x1={340} y1={82} x2={340} y2={194} color={tok('ink', 0.7)} />
      <T x={260} y={112} size={11} fill={tok('muted')}>2. rest ends</T>
      <T x={260} y={124} size={11} fill={tok('muted')}>the rule</T>
      <Arrow x1={270} y1={82} x2={130} y2={194} color={tok('ink', 0.7)} dash />
      <T x={168} y={174} size={11} fill={tok('muted')}>3. rest can vanish,</T>
      <T x={168} y={186} size={11} fill={tok('muted')}>so item may end expr</T>
    </Svg>
  );
}
