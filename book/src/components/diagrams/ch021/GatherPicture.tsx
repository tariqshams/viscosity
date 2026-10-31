import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const FIELDS = ['x', 'y', 'vx', 'vy', 'mass', 'health'];
const COL = ['f1', 'f2', 'f3', 'f4', 'f5', 'f6'];
const CW = 15;
const X0 = 20;

/** AoS needs a gather to fill one register with x values; SoA needs one load. */
export default function GatherPicture() {
  const reg = (y: number) => (
    <Box x={X0} y={y} w={4 * 44 + 8} h={28} r={6} fill={tok('brand', 0.1)} stroke={tok('brand')}>
      {[0, 1, 2, 3].map((k) => (
        <g key={k}>
          <rect x={X0 + 6 + k * 44} y={y + 5} width={40} height={18} rx={3} fill={tok('f1', 0.85)} />
          <T x={X0 + 26 + k * 44} y={y + 14.5} size={11} mono weight={700} anchor="middle" fill={tok('panel')}>x{k}</T>
        </g>
      ))}
    </Box>
  );
  return (
    <Svg w={400} h={300} title="Top: in an array of structs, the x values are 6 slots apart, so filling a 4-lane register needs a gather from 4 places. Bottom: in a struct of arrays, the 4 x values are side by side and one vector load fills the register.">
      <T x={X0} y={12} size={13} weight={700}>AoS: x values are 6 slots apart</T>
      {Array.from({ length: 24 }, (_, i) => (
        <rect key={i} x={X0 + i * CW} y={26} width={CW - 2} height={22} rx={2} fill={tok(COL[i % 6], i % 6 === 0 ? 0.9 : 0.25)} />
      ))}
      {[0, 1, 2, 3].map((k) => (
        <Arrow key={k} x1={X0 + k * 6 * CW + 6} y1={50} x2={X0 + 26 + k * 44} y2={92} color={tok('ink', 0.55)} width={1.5} />
      ))}
      {reg(94)}
      <T x={X0 + 192} y={108} size={12} fill={tok('muted')}>gather: 4 separate reads</T>

      <T x={X0} y={160} size={13} weight={700}>SoA: the x column, side by side</T>
      {Array.from({ length: 24 }, (_, i) => (
        <rect key={i} x={X0 + i * CW} y={174} width={CW - 2} height={22} rx={2} fill={tok('f1', i < 4 ? 0.9 : 0.45)} />
      ))}
      <path d={`M${X0},${202} v6 h${4 * CW - 2} v-6`} fill="none" stroke={tok('ink', 0.6)} strokeWidth={1.5} />
      <Arrow x1={X0 + 2 * CW} y1={210} x2={X0 + 90} y2={240} color={tok('ink', 0.55)} width={1.5} />
      {reg(242)}
      <T x={X0 + 192} y={256} size={12} fill={tok('muted')}>one vector load</T>
      <g>
        {FIELDS.map((f, k) => (
          <g key={f}>
            <rect x={X0 + k * 60} y={284} width={10} height={10} rx={2} fill={tok(COL[k])} />
            <T x={X0 + 14 + k * 60} y={289.5} size={10} mono fill={tok('muted')}>{f}</T>
          </g>
        ))}
      </g>
    </Svg>
  );
}
