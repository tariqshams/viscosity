import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// How load.global finds a value: operand -> constant pool -> interned name
// (with its stored hash) -> slot in vm.globals. Real numbers: the bytes of
// `load.global 2 'a'` in `let a = 1; print a;`, hash("a") = 3826002220,
// and & 7 = 4, from which a probes on to slot 7 (len, clock, push are in
// 4, 5 and 6).
export default function NameToValue() {
  return (
    <Svg w={400} h={236} title="Three hops: the instruction's two operand bytes give a constant index; that constant is the interned string a, which carries its hash; the hash picks a slot in the globals table, where the value is.">
      <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>1. THE INSTRUCTION (3 bytes)</T>
      {[['10', 'load.global'], ['0', 'high'], ['2', 'low']].map(([b, l], k) => (
        <g key={k}>
          <Box x={8 + k * 62} y={22} w={58} h={30} r={3} fill={k === 0 ? tok('brand', 0.12) : tok('panel')}>
            <T x={37 + k * 62} y={37} size={14} mono anchor="middle" weight={700}>{b}</T>
          </Box>
          <T x={37 + k * 62} y={62} size={11} anchor="middle" fill={tok('muted')}>{l}</T>
        </g>
      ))}
      <T x={200} y={37} size={12} mono>operand = 0 × 256 + 2 = 2</T>
      <Arrow x1={140} y1={70} x2={60} y2={100} />
      <T x={8} y={92} size={11} weight={700} fill={tok('muted')}>2. CONSTANT POOL</T>
      {["'1'", "'a'", "'a'"].map((c, k) => (
        <g key={k}>
          <T x={16 + k * 50} y={110} size={11} mono anchor="middle" fill={tok('muted')}>{k}</T>
          <Box x={0 + k * 50 + 2} y={118} w={44} h={26} r={3} stroke={k === 2 ? tok('brand') : tok('line')}>
            <T x={24 + k * 50} y={131} size={12} mono anchor="middle">{c}</T>
          </Box>
        </g>
      ))}
      <Arrow x1={148} y1={131} x2={196} y2={131} />
      <Box x={198} y={104} w={194} h={54} r={5} fill={tok('safe', 0.08)} stroke={tok('safe')}>
        <T x={208} y={120} size={11} fill={tok('muted')}>the one string object "a"</T>
        <T x={208} y={140} size={12} mono>hash 3826002220</T>
      </Box>
      <T x={8} y={174} size={11} weight={700} fill={tok('muted')}>3. vm.globals: hash &amp; 7 = 4, probe to 7</T>
      {['pop', 'str', '', '', 'len', 'clock', 'push', 'a = 1'].map((k, i) => (
        <Box key={i} x={8 + i * 48} y={186} w={44} h={34} r={3} fill={i === 7 ? tok('brand', 0.15) : tok('panel')} stroke={i === 7 ? tok('brand') : i >= 4 ? tok('accent') : tok('line')}>
          <T x={30 + i * 48} y={203} size={11} mono anchor="middle" weight={i === 7 ? 700 : 400}>{k}</T>
        </Box>
      ))}
    </Svg>
  );
}
