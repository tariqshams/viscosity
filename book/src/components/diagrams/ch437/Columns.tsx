import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 436b: where `ps` starts on line 9 of this chapter's fr.js,
// `const t = "🎉"; f(t, ps[2]);`, counted three ways. A small rustc
// program here printed 23 (UTF-8 bytes, Rust's str::find), 21 (UTF-16 code
// units, encode_utf16().count()) and 20 (code points, chars().count()).
// The emoji U+1F389 is 4 bytes in UTF-8, 2 units in UTF-16 (a surrogate
// pair) and 1 code point.
const CHARS = ['c', 'o', 'n', 's', 't', ' ', 't', ' ', '=', ' ', '"', '🎉', '"', ';', ' ', 'f', '(', 't', ',', ' ', 'p', 's'];

type Ruler = { label: string; unit: (c: string) => number; total: number; color: string; who: string };
const RULERS: Ruler[] = [
  { label: 'UTF-8 bytes', unit: (c) => (c === '🎉' ? 4 : 1), total: 23, color: 'f1', who: 'Rust spans (oxc)' },
  { label: 'UTF-16 units', unit: (c) => (c === '🎉' ? 2 : 1), total: 21, color: 'f3', who: 'TypeScript spans (acorn)' },
  { label: 'code points', unit: () => 1, total: 20, color: 'f2', who: 'both frames count these' },
];

export default function Columns() {
  const cw = 17;
  const x0 = 6;
  return (
    <Svg w={400} h={236} title="The start of ps on one line, counted in UTF-8 bytes, UTF-16 units and code points">
      {CHARS.map((c, k) => (
        <T key={k} x={x0 + k * cw + cw / 2} y={14} size={13} mono anchor="middle" fill={k >= 20 ? tok('brand') : undefined} weight={k >= 20 ? 700 : undefined}>{c}</T>
      ))}
      {RULERS.map((r, j) => {
        const y = 34 + j * 66;
        return (
          <g key={r.label}>
            {CHARS.slice(0, 20).map((c, k) => {
              const n = r.unit(c);
              return (
                <Box key={k} x={x0 + k * cw + 1} y={y} w={cw - 2} h={20} r={2} fill={n > 1 ? tok(r.color, 0.45) : tok(r.color, 0.15)} stroke={tok(r.color)}>
                  <T x={x0 + k * cw + cw / 2} y={y + 10} size={11} mono anchor="middle">{n}</T>
                </Box>
              );
            })}
            <T x={x0} y={y + 34} size={11} weight={700}>{r.label}</T>
            <T x={x0 + 100} y={y + 34} size={11} mono>{`ps at ${r.total}`}</T>
            <T x={394} y={y + 34} size={11} anchor="end" fill={tok('muted')}>{r.who}</T>
          </g>
        );
      })}
    </Svg>
  );
}
