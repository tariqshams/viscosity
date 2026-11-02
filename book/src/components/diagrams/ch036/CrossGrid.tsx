import { Box, Svg, T, tok } from '../../viz/svg';

// `${'top' | 'bottom'}-${'left' | 'right'}`: every pairing of the two
// unions, drawn as a grid, gives four string types.
const ROWS = ['top', 'bottom'];
const COLS = ['left', 'right'];

export default function CrossGrid() {
  return (
    <Svg w={400} h={170} title="A template literal type with two unions makes every combination: four corner names">
      <T x={8} y={14} size={12} mono>{"`${'top' | 'bottom'}-${'left' | 'right'}`"}</T>
      {COLS.map((c, j) => (
        <T key={c} x={176 + j * 112} y={44} size={13} mono weight={700} anchor="middle" fill={tok('f2')}>{`'${c}'`}</T>
      ))}
      {ROWS.map((r, i) => (
        <g key={r}>
          <T x={104} y={78 + i * 50} size={13} mono weight={700} anchor="end" fill={tok('f1')}>{`'${r}'`}</T>
          {COLS.map((c, j) => (
            <Box key={c} x={122 + j * 112} y={58 + i * 50} w={106} h={40} fill={tok('brand', 0.08)} stroke={tok('brand')}>
              <T x={175 + j * 112} y={78 + i * 50} size={11} mono anchor="middle">{`'${r}-${c}'`}</T>
            </Box>
          ))}
        </g>
      ))}
      <T x={8} y={160} size={12}>2 choices × 2 choices = 4 string types in one union.</T>
    </Svg>
  );
}
