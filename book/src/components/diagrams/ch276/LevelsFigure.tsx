import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 276: one visible character, 👩‍💻, counted four ways.
const ROWS = [
  { label: 'what you see', n: 1, cells: ['👩‍💻'], c: 'f3', what: 'grapheme cluster' },
  { label: 'code points', n: 3, cells: ['1F469', '200D', '1F4BB'], c: 'f2', what: 'Python len, Drip len' },
  { label: 'UTF-16 units', n: 5, cells: ['D83D', 'DC69', '200D', 'D83D', 'DCBB'], c: 'f1', what: 'JavaScript .length' },
  { label: 'UTF-8 bytes', n: 11, cells: ['F0', '9F', '91', 'A9', 'E2', '80', '8D', 'F0', '9F', '92', 'BB'], c: 'f4', what: 'Rust .len()' },
];

export default function LevelsFigure() {
  return (
    <Svg w={400} h={240} title="The emoji woman technologist is 1 grapheme cluster, 3 code points, 5 UTF-16 units and 11 UTF-8 bytes">
      {ROWS.map((r, k) => {
        const y = 8 + k * 58;
        const w = 384 / r.cells.length;
        return (
          <g key={k}>
            <T x={8} y={y + 6} size={11} weight={700} fill={tok('muted')}>{`${r.label.toUpperCase()}: ${r.n}`}</T>
            <T x={392} y={y + 6} size={11} anchor="end" fill={tok('muted')}>{r.what}</T>
            {r.cells.map((cell, j) => (
              <Box key={j} x={8 + j * w} y={y + 16} w={w - 3} h={28} fill={tok(r.c, 0.12)} stroke={tok(r.c)}>
                <T x={8 + j * w + (w - 3) / 2} y={y + 30} size={k === 3 ? 11 : 12} mono anchor="middle">{cell}</T>
              </Box>
            ))}
          </g>
        );
      })}
    </Svg>
  );
}
