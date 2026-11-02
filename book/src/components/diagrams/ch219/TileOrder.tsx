// Chapter 219: the order an 8 x 8 loop nest visits its iterations, row by
// row and in 4 x 4 tiles. Both cover every (i, j) exactly once.
import { Svg, T, tok } from '../../viz/svg';

const N = 8;
const C = 22;

function Grid({ x0, tiled, label }: { x0: number; tiled: boolean; label: string }) {
  const num = (i: number, j: number) => {
    if (!tiled) return i * N + j + 1;
    const tile = Math.floor(i / 4) * 2 + Math.floor(j / 4);
    return tile * 16 + (i % 4) * 4 + (j % 4) + 1;
  };
  return (
    <g>
      <T x={x0 + (N * C) / 2} y={14} size={12} weight={700} anchor="middle" fill={tok('muted')}>{label}</T>
      {Array.from({ length: N * N }, (_, k) => {
        const i = Math.floor(k / N);
        const j = k % N;
        const first = tiled ? i < 4 && j < 4 : i === 0;
        return (
          <g key={k}>
            <rect x={x0 + j * C} y={28 + i * C} width={C - 1} height={C - 1} rx={2}
              fill={first ? tok('brand', 0.25) : tok('panel')} stroke={tok('line')} strokeWidth={1} />
            <T x={x0 + j * C + C / 2 - 0.5} y={28 + i * C + C / 2} size={11} mono anchor="middle">{num(i, j)}</T>
          </g>
        );
      })}
    </g>
  );
}

export default function TileOrder() {
  return (
    <Svg w={400} h={210} title="Two 8 by 8 grids numbered in visiting order: row by row, and tile by tile">
      <Grid x0={8} tiled={false} label="row by row" />
      <Grid x0={216} tiled={true} label="4 × 4 tiles" />
    </Svg>
  );
}
