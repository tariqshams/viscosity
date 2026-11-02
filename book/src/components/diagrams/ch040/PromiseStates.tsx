import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

/** A promise's three states: it starts pending and settles exactly once. */
export default function PromiseStates() {
  return (
    <Svg w={400} h={210} title="A promise starts pending. Calling resolve with a value moves it to fulfilled, where then callbacks receive the value; calling reject with a reason moves it to rejected, where catch callbacks receive the reason. Once settled it never changes.">
      <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>STARTS HERE</T>
      <Box x={4} y={82} w={110} h={44} stroke={tok('warn')} fill={tok('warn', 0.12)}>
        <T x={59} y={98} size={14} weight={700} anchor="middle">pending</T>
        <T x={59} y={115} size={11} anchor="middle" fill={tok('muted')}>no value yet</T>
      </Box>
      <Arrow x1={116} y1={96} x2={230} y2={48} color={tok('safe')} width={1.75} />
      <T x={150} y={56} size={12} mono anchor="middle" fill={tok('safe')}>resolve(v)</T>
      <Arrow x1={116} y1={112} x2={230} y2={162} color={tok('danger')} width={1.75} />
      <T x={150} y={156} size={12} mono anchor="middle" fill={tok('danger')}>reject(e)</T>
      <T x={234} y={12} size={11} weight={700} fill={tok('muted')}>SETTLED, FOR GOOD</T>
      <Box x={234} y={24} w={162} h={50} stroke={tok('safe')} fill={tok('safe', 0.1)}>
        <T x={246} y={41} size={14} weight={700}>fulfilled</T>
        <T x={246} y={60} size={11} mono>then(f) calls f(v)</T>
      </Box>
      <Box x={234} y={136} w={162} h={50} stroke={tok('danger')} fill={tok('danger', 0.08)}>
        <T x={246} y={153} size={14} weight={700}>rejected</T>
        <T x={246} y={172} size={11} mono>catch(g) calls g(e)</T>
      </Box>
      <T x={8} y={203} size={11} fill={tok('muted')}>A second resolve or reject is ignored: a promise settles once.</T>
    </Svg>
  );
}
