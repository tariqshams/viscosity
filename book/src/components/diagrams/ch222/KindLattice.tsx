// Chapter 222: the lattice of kind sets for three kinds, drawn as a Hasse
// diagram. Join is union (go up to the smallest set containing both);
// the empty set at the bottom is the optimistic start.
import { Box, Svg, T, tok } from '../../viz/svg';

const ROWS = [
  ['{number, string, object}'],
  ['{number, string}', '{number, object}', '{string, object}'],
  ['{number}', '{string}', '{object}'],
  ['{ }'],
];
const Y = [20, 92, 164, 236];
const xs = (n: number) => (n === 1 ? [210] : [76, 210, 344]);
const UP: [number, number, number, number][] = [
  [1, 0, 0, 0], [1, 1, 0, 0], [1, 2, 0, 0],
  [2, 0, 1, 0], [2, 0, 1, 1], [2, 1, 1, 0], [2, 1, 1, 2], [2, 2, 1, 1], [2, 2, 1, 2],
  [3, 0, 2, 0], [3, 0, 2, 1], [3, 0, 2, 2],
];

export default function KindLattice() {
  return (
    <Svg w={420} h={262} title="Sets of kinds ordered by inclusion: the empty set at the bottom, the three single kinds above it, the three pairs above them, and the set of all three at the top; lines join each set to the sets one kind larger">
      {UP.map(([r, i, r2, j], k) => (
        <line key={k} x1={xs(ROWS[r].length)[i]} y1={Y[r] - 12} x2={xs(ROWS[r2].length)[j]} y2={Y[r2] + 12} stroke={tok('line')} strokeWidth={1.5} />
      ))}
      {ROWS.map((row, r) => row.map((label, i) => {
        const x = xs(row.length)[i];
        const w = row.length === 1 && r === 0 ? 200 : 126;
        const c = r === 0 ? 'danger' : r === 3 ? 'muted' : r === 2 ? 'safe' : 'warn';
        return (
          <Box key={label} x={x - w / 2} y={Y[r] - 12} w={w} h={24} fill={tok(c, 0.12)} stroke={tok(c)}>
            <T x={x} y={Y[r]} size={11.5} mono anchor="middle">{label}</T>
          </Box>
        );
      }))}
    </Svg>
  );
}
