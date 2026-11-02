// Chapter 201-b (staged split of 187): the three-level constant lattice.
// ⊤ above every constant, every constant above ⊥, and no order between two
// different constants (so their meet falls to ⊥).
import { Box, Svg, T, tok } from '../../viz/svg';

const MID = ['…', '-1', '0', '1', '2', '"hi"', 'true', '…'];

export default function ConstLattice() {
  const w = 400;
  const top = { x: 200, y: 26 };
  const bot = { x: 200, y: 190 };
  const my = 108;
  const xs = MID.map((_, k) => 30 + k * 48);
  return (
    <Svg w={w} h={226} title="A diamond-shaped lattice: top at the top, a row of constants in the middle, bottom at the bottom, with lines from top to every constant and from every constant to bottom.">
      {xs.map((x, k) => MID[k] === '…' ? null : (
        <g key={k}>
          <line x1={top.x} y1={top.y + 14} x2={x} y2={my - 14} stroke={tok('ink', 0.35)} strokeWidth={1.5} />
          <line x1={x} y1={my + 14} x2={bot.x} y2={bot.y - 14} stroke={tok('ink', 0.35)} strokeWidth={1.5} />
        </g>
      ))}
      <Box x={top.x - 26} y={top.y - 14} w={52} h={28} fill={tok('brand', 0.12)} stroke={tok('brand')}>
        <T x={top.x} y={top.y} size={15} weight={700} anchor="middle">⊤</T>
      </Box>
      <T x={top.x + 36} y={top.y} size={12} fill={tok('muted')}>no information yet</T>
      {xs.map((x, k) => (
        MID[k] === '…'
          ? <T key={k} x={x} y={my} size={14} anchor="middle" fill={tok('muted')}>…</T>
          : <Box key={k} x={x - 21} y={my - 14} w={42} h={28} fill={tok('safe', 0.12)} stroke={tok('safe')}>
              <T x={x} y={my} size={12} mono anchor="middle">{MID[k]}</T>
            </Box>
      ))}
      <T x={200} y={my + 28} size={12} anchor="middle" fill={tok('muted')}>one constant (no order between them)</T>
      <Box x={bot.x - 26} y={bot.y - 14} w={52} h={28} fill={tok('danger', 0.12)} stroke={tok('danger')}>
        <T x={bot.x} y={bot.y} size={15} weight={700} anchor="middle">⊥</T>
      </Box>
      <T x={bot.x + 36} y={bot.y} size={12} fill={tok('muted')}>varies</T>
    </Svg>
  );
}
