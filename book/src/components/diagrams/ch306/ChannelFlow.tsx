import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// An mpsc channel: three Sender clones on three threads, one queue, one
// Receiver. Static.

export default function ChannelFlow() {
  const senders = ['thread 1: tx', 'thread 2: tx.clone()', 'thread 3: tx.clone()'];
  const queue = ['(0, "a")', '(2, "c")', '(1, "b")'];
  return (
    <Svg w={400} h={200} title="Three senders put values into one queue, which one receiver takes them from in order">
      {senders.map((name, i) => (
        <g key={name}>
          <Box x={8} y={14 + i * 46} w={130} h={34} r={4} fill={tok('f2', 0.12)} stroke={tok('f2')}>
            <T x={73} y={31 + i * 46} size={11} mono anchor="middle">{name}</T>
          </Box>
          <Arrow x1={140} y1={31 + i * 46} x2={176} y2={83} color={tok('f2')} />
        </g>
      ))}
      <T x={256} y={34} size={11} weight={700} anchor="middle" fill={tok('muted')}>QUEUE (FIFO)</T>
      <Box x={180} y={44} w={152} h={78} r={4} fill={tok('panel')} stroke={tok('line')}>
        {queue.map((q, i) => (
          <Box key={q} x={188} y={52 + i * 22} w={136} h={18} r={2} fill={tok('brand', 0.1)} stroke={tok('brand')}>
            <T x={256} y={61 + i * 22} size={11} mono anchor="middle">{q}</T>
          </Box>
        ))}
      </Box>
      <Arrow x1={334} y1={83} x2={356} y2={83} color={tok('brand')} />
      <Box x={358} y={60} w={34} h={46} r={4} fill={tok('safe', 0.12)} stroke={tok('safe')}>
        <T x={375} y={83} size={11} mono anchor="middle">rx</T>
      </Box>
      <T x={8} y={168} size={11} fill={tok('muted')}>send moves each value in; recv takes the oldest out.</T>
      <T x={8} y={186} size={11} fill={tok('muted')}>for v in rx ends when every tx has been dropped.</T>
    </Svg>
  );
}
