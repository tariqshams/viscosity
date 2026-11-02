import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 385: what a command-line program receives and gives back. The
// example run is the release build of engine/rust/crates/cli, run by the
// author: `viscosity explain p.js > out.txt` wrote the report to out.txt,
// nothing to stderr, and exited with status 0.
export default function Streams() {
  return (
    <Svg w={400} h={236} title="A CLI receives a list of words from the shell and gives back three things: standard output, standard error and an exit status.">
      <T x={8} y={14} size={11} weight={700} fill={tok('muted')}>IN: THE WORDS YOU TYPED</T>
      <Box x={8} y={24} w={66} h={26} r={4} fill={tok('f1', 0.15)} stroke={tok('f1')}>
        <T x={41} y={37} size={12} mono anchor="middle">explain</T>
      </Box>
      <Box x={80} y={24} w={48} h={26} r={4} fill={tok('f2', 0.15)} stroke={tok('f2')}>
        <T x={104} y={37} size={12} mono anchor="middle">p.js</T>
      </Box>
      <T x={140} y={37} size={11} fill={tok('muted')}>argv: a list of strings</T>
      <Arrow x1={68} y1={54} x2={68} y2={82} />
      <Box x={8} y={84} w={384} h={50} r={8} fill={tok('panel')} stroke={tok('ink', 0.6)}>
        <T x={20} y={102} size={13} mono weight={700}>viscosity</T>
        <T x={20} y={121} size={11} fill={tok('muted')}>parse the words, compile, report</T>
      </Box>
      <Arrow x1={60} y1={136} x2={60} y2={170} color={tok('brand')} />
      <Arrow x1={200} y1={136} x2={200} y2={170} color={tok('danger')} />
      <Arrow x1={330} y1={136} x2={330} y2={170} color={tok('safe')} />
      <Box x={8} y={172} w={120} h={56} r={5} fill={tok('brand', 0.1)} stroke={tok('brand')}>
        <T x={68} y={188} size={12} weight={700} anchor="middle" fill={tok('brand')}>stdout</T>
        <T x={68} y={204} size={11} anchor="middle">the results</T>
        <T x={68} y={219} size={11} mono anchor="middle">&gt; out.txt</T>
      </Box>
      <Box x={140} y={172} w={120} h={56} r={5} fill={tok('danger', 0.1)} stroke={tok('danger')}>
        <T x={200} y={188} size={12} weight={700} anchor="middle" fill={tok('danger')}>stderr</T>
        <T x={200} y={204} size={11} anchor="middle">the messages</T>
        <T x={200} y={219} size={11} anchor="middle">stay on screen</T>
      </Box>
      <Box x={272} y={172} w={120} h={56} r={5} fill={tok('safe', 0.1)} stroke={tok('safe')}>
        <T x={332} y={188} size={12} weight={700} anchor="middle" fill={tok('safe')}>exit status</T>
        <T x={332} y={204} size={11} anchor="middle">one number</T>
        <T x={332} y={219} size={11} mono anchor="middle">0 = success</T>
      </Box>
    </Svg>
  );
}
