import { Box, Svg, T, tok } from '../../viz/svg';

const COLORS = ['f1', 'f2', 'f3', 'f4'];
const NAMES = ['x', 'y', 'vx', 'vy'];

/** An array of objects (array of structs): each slot holds a whole record. */
export default function AosPicture() {
  return (
    <Svg w={400} h={190} title="An array of three particle objects. Slot 0, 1 and 2 each hold a whole particle with its own x, y, vx and vy, kept together.">
      <T x={8} y={14} size={14} mono weight={700}>particles</T>
      {[0, 1, 2].map((i) => {
        const x = 8 + i * 132;
        return (
          <g key={i}>
            <Box x={x} y={26} w={124} h={128} r={6} stroke={tok('ink', 0.45)}>
              {NAMES.map((n, k) => (
                <g key={n}>
                  <rect x={x + 10} y={36 + k * 28} width={104} height={22} rx={3} fill={tok(COLORS[k], 0.85)} />
                  <T x={x + 18} y={47.5 + k * 28} size={13} mono weight={700} fill={tok('panel')}>{n}</T>
                </g>
              ))}
            </Box>
            <T x={x + 62} y={170} size={13} mono anchor="middle" fill={tok('muted')}>[{i}]</T>
          </g>
        );
      })}
    </Svg>
  );
}

/** The same data, if every field kept its own array: a struct of arrays. */
export function SoaTeaser() {
  return (
    <Svg w={400} h={190} title="The same three particles stored as a struct of arrays: one row holds every x, the next every y, then every vx, then every vy.">
      {NAMES.map((n, k) => (
        <g key={n}>
          <T x={8} y={30 + k * 44} size={13} mono weight={700} fill={tok(COLORS[k])}>{n}</T>
          <Box x={44} y={14 + k * 44} w={348} h={34} r={5} stroke={tok('ink', 0.35)}>
            {[0, 1, 2].map((i) => (
              <rect key={i} x={52 + i * 112} y={20 + k * 44} width={104} height={22} rx={3} fill={tok(COLORS[k], 0.85)} />
            ))}
          </Box>
        </g>
      ))}
    </Svg>
  );
}
