// A scheme is copied, with fresh variables, at each use; the copies are
// settled separately, so they cannot clash.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

export default function SchemeCopies() {
  return (
    <Svg w={400} h={190} title="The scheme id : for all alpha, alpha to alpha, at the top, with two arrows down to two copies: beta to beta, where beta is settled as bool, and gamma to gamma, where gamma is settled as number">
      <Box x={110} y={12} w={180} h={40} fill={tok('brand', 0.1)} stroke={tok('brand')}>
        <T x={200} y={32} size={14} mono anchor="middle" weight={700}>id : ∀α. α → α</T>
      </Box>
      <T x={200} y={66} size={11} anchor="middle" fill={tok('muted')}>stored once, with a blank (α)</T>
      <Arrow x1={160} y1={76} x2={100} y2={108} />
      <Arrow x1={240} y1={76} x2={300} y2={108} />
      <T x={92} y={86} size={11} anchor="middle" fill={tok('muted')}>use 1</T>
      <T x={308} y={86} size={11} anchor="middle" fill={tok('muted')}>use 2</T>
      <Box x={20} y={112} w={160} h={54} stroke={tok('accent')}>
        <T x={100} y={130} size={13} mono anchor="middle">β → β</T>
        <T x={100} y={152} size={12} mono anchor="middle" fill={tok('accent')}>β = bool</T>
      </Box>
      <Box x={220} y={112} w={160} h={54} stroke={tok('accent')}>
        <T x={300} y={130} size={13} mono anchor="middle">γ → γ</T>
        <T x={300} y={152} size={12} mono anchor="middle" fill={tok('accent')}>γ = number</T>
      </Box>
      <T x={200} y={182} size={11} anchor="middle" fill={tok('muted')}>fresh copies: settling one leaves the other free</T>
    </Svg>
  );
}
