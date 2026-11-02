import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const OBJ = [
  { x: 150, y: 10, px: 0, pv: 2 },
  { x: 290, y: 34, px: 0, pv: 0 },
  { x: 196, y: 70, px: 0, pv: -1 },
];

/** Objects reached through arrows, versus one packed column per field. */
export default function ColumnsLayout() {
  return (
    <Svg w={400} h={236} title="Top: an array of three arrows, each pointing to a separate particle object holding x and vx, scattered in memory. Bottom: two Float64Arrays, x and vx, each three 8-byte slots packed side by side.">
      <T x={8} y={10} size={11} weight={700} fill={tok('muted')}>ARRAY OF OBJECTS</T>
      {[0, 1, 2].map((k) => (
        <Box key={k} x={8 + k * 34} y={22} w={30} h={28} fill={tok('panel')} stroke={tok('ink', 0.5)}>
          <circle cx={23 + k * 34} cy={36} r={3.5} fill={tok('ink', 0.7)} />
        </Box>
      ))}
      {OBJ.map((o, k) => (
        <g key={k}>
          <Arrow x1={23 + k * 34} y1={50} x2={o.x} y2={o.y + 30} bend={k === 1 ? -0.4 : 0.3} width={1.3} />
          <Box x={o.x} y={o.y + 10} w={92} h={34} r={6} fill={tok('panel')} stroke={tok('ink', 0.45)}>
            <T x={o.x + 8} y={o.y + 27} size={11} mono>
              <tspan fill={tok('f1')}>x</tspan>:{o.px} <tspan fill={tok('f3')}>vx</tspan>:{o.pv}
            </T>
          </Box>
        </g>
      ))}
      <line x1={8} y1={130} x2={392} y2={130} stroke={tok('line')} />
      <T x={8} y={146} size={11} weight={700} fill={tok('muted')}>ONE Float64Array PER FIELD</T>
      {[{ name: 'x', c: 'f1', v: ['0', '0', '0'], y: 160 }, { name: 'vx', c: 'f3', v: ['2', '0', '-1'], y: 196 }].map((col) => (
        <g key={col.name}>
          <T x={8} y={col.y + 14} size={13} mono weight={700} fill={tok(col.c)}>{col.name}</T>
          {col.v.map((v, k) => (
            <Box key={k} x={44 + k * 88} y={col.y} w={88} h={28} r={0} fill={tok(col.c, 0.12)} stroke={tok(col.c)}>
              <T x={88 + k * 88} y={col.y + 14.5} size={13} mono anchor="middle">{v}</T>
            </Box>
          ))}
          <T x={316} y={col.y + 14} size={11} fill={tok('muted')}>8 bytes each</T>
        </g>
      ))}
    </Svg>
  );
}
