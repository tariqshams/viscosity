import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 382b: the main parts of a Tokio-style runtime, after the
// Tokio README (a multithreaded, work-stealing task scheduler and a
// reactor backed by the OS event queue: epoll, kqueue, IOCP) and the
// Async Book's division into reactor, scheduler and executor.
export default function RuntimeMap() {
  return (
    <Svg w={400} h={236} title="Workers poll ready tasks from queues; waiting tasks sit with the reactor until an operating system event wakes them">
      <T x={10} y={14} size={12} weight={700} fill={tok('brand')}>scheduler: worker threads</T>
      {[0, 1].map((k) => (
        <Box key={k} x={10 + k * 128} y={26} w={118} h={74} fill={tok('safe', 0.08)} stroke={tok('safe')}>
          <T x={22 + k * 128} y={44} size={11} weight={700}>worker {k + 1}</T>
          <T x={22 + k * 128} y={62} size={11} mono>polls task</T>
          <T x={22 + k * 128} y={84} size={11} fill={tok('muted')}>queue: ▢ ▢ ▢</T>
        </Box>
      ))}
      <T x={266} y={58} size={11} fill={tok('muted')}>idle workers</T>
      <T x={266} y={74} size={11} fill={tok('muted')}>steal from busy</T>
      <T x={266} y={90} size={11} fill={tok('muted')}>ones' queues</T>
      <Box x={10} y={146} w={246} h={74} fill={tok('warn', 0.1)} stroke={tok('warn')}>
        <T x={22} y={164} size={11} weight={700}>reactor</T>
        <T x={22} y={184} size={11}>waiting tasks: sockets, timers</T>
        <T x={22} y={204} size={11} fill={tok('muted')}>cost nothing while they wait</T>
      </Box>
      <Box x={276} y={146} w={116} h={74} fill={tok('panel')} stroke={tok('line')}>
        <T x={334} y={170} size={11} weight={700} anchor="middle">OS event</T>
        <T x={334} y={190} size={11} anchor="middle" mono>epoll /</T>
        <T x={334} y={206} size={11} anchor="middle" mono>kqueue</T>
      </Box>
      <Arrow x1={70} y1={100} x2={70} y2={146} color={tok('ink', 0.6)} />
      <T x={78} y={124} size={11} fill={tok('muted')}>Pending</T>
      <Arrow x1={200} y1={146} x2={200} y2={100} color={tok('brand')} />
      <T x={208} y={124} size={11} fill={tok('brand')}>wake</T>
      <Arrow x1={276} y1={182} x2={256} y2={182} color={tok('ink', 0.6)} />
    </Svg>
  );
}
