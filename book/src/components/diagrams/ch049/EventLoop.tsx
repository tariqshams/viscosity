import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// One turn of the event loop, as far as an engine needs it: the current
// job runs to the end (orange), then every queued microtask (blue), then
// the next task, such as a timer (grey). Nothing interrupts a job.
export default function EventLoop() {
  return (
    <Svg w={400} h={150} title="The current job runs to completion, then all microtasks, then the next task such as a timer">
      <Box x={10} y={30} w={130} h={52} fill={tok('brand', 0.2)} stroke={tok('brand')}>
        <T x={75} y={48} size={12} weight={700} anchor="middle">current job</T>
        <T x={75} y={66} size={11} mono anchor="middle">log('sync')</T>
      </Box>
      <Box x={160} y={30} w={110} h={52} fill={tok('accent', 0.18)} stroke={tok('accent')}>
        <T x={215} y={48} size={12} weight={700} anchor="middle">microtasks</T>
        <T x={215} y={66} size={11} mono anchor="middle">then(...)</T>
      </Box>
      <Box x={290} y={30} w={100} h={52} fill={tok('muted', 0.15)}>
        <T x={340} y={48} size={12} weight={700} anchor="middle">next task</T>
        <T x={340} y={66} size={11} mono anchor="middle">setTimeout</T>
      </Box>
      <Arrow x1={140} y1={56} x2={158} y2={56} />
      <Arrow x1={270} y1={56} x2={288} y2={56} />
      <T x={75} y={18} size={11} anchor="middle" fill={tok('muted')}>runs to the end</T>
      <T x={215} y={18} size={11} anchor="middle" fill={tok('muted')}>all of them</T>
      <T x={340} y={18} size={11} anchor="middle" fill={tok('muted')}>one at a time</T>
      <Arrow x1={340} y1={84} x2={75} y2={86} bend={-0.6} dash />
      <T x={200} y={140} size={11} anchor="middle" fill={tok('muted')}>then the loop goes round again</T>
    </Svg>
  );
}
