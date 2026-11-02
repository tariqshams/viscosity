import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

/** Which way values may flow between number and two branded ids. */
export default function BrandWall() {
  return (
    <Svg w={400} h={236} title="A box for number at the top, and two branded types below it, ValueId and BlockId. Arrows up from each brand to number are allowed: a branded id can be used as a number. The arrow from number straight down to BlockId is refused, and so is the arrow from ValueId across to BlockId. The only way in is through the function blockId, which checks the number and stamps it with as.">
      <Box x={130} y={8} w={140} h={36} fill={tok('panel')} stroke={tok('ink', 0.5)}>
        <T x={200} y={26} size={14} mono weight={700} anchor="middle">number</T>
      </Box>
      <Box x={10} y={168} w={130} h={56} fill={tok('f1', 0.12)} stroke={tok('f1')}>
        <T x={75} y={186} size={13} mono weight={700} anchor="middle">ValueId</T>
        <T x={75} y={206} size={11} mono anchor="middle" fill={tok('muted')}>number & 'ValueId'</T>
      </Box>
      <Box x={260} y={168} w={130} h={56} fill={tok('f2', 0.12)} stroke={tok('f2')}>
        <T x={325} y={186} size={13} mono weight={700} anchor="middle">BlockId</T>
        <T x={325} y={206} size={11} mono anchor="middle" fill={tok('muted')}>number & 'BlockId'</T>
      </Box>
      <Arrow x1={75} y1={166} x2={150} y2={48} color={tok('safe')} />
      <T x={52} y={100} size={11} weight={700} fill={tok('safe')} anchor="middle">✓ used as</T>
      <T x={52} y={114} size={11} weight={700} fill={tok('safe')} anchor="middle">a number</T>
      <Arrow x1={250} y1={48} x2={325} y2={166} color={tok('danger')} dash />
      <T x={342} y={92} size={11} weight={700} fill={tok('danger')} anchor="middle">✗ plain number</T>
      <T x={342} y={106} size={11} weight={700} fill={tok('danger')} anchor="middle">refused</T>
      <Arrow x1={142} y1={208} x2={258} y2={208} color={tok('danger')} dash />
      <T x={200} y={222} size={11} weight={700} fill={tok('danger')} anchor="middle">✗ wrong brand</T>
      <Box x={150} y={104} w={110} h={36} fill={tok('brand', 0.1)} stroke={tok('brand')}>
        <T x={205} y={122} size={12} mono weight={700} anchor="middle">blockId(n)</T>
      </Box>
      <Arrow x1={200} y1={46} x2={200} y2={102} color={tok('brand')} />
      <Arrow x1={240} y1={142} x2={290} y2={166} color={tok('brand')} />
      <T x={206} y={160} size={11} fill={tok('brand')} anchor="end">checks, then as</T>
    </Svg>
  );
}
