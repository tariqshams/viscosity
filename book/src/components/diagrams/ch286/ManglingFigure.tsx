import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 286: the C++ declaration geo::area(double), and the pieces of
// its Itanium-ABI symbol _ZN3geo4areaEd (checked with clang 18 and nm).
const PARTS = [
  { s: '_Z', what: 'a C++ name', c: 'muted' },
  { s: 'N', what: 'nested in…', c: 'f1' },
  { s: '3geo', what: 'namespace', c: 'f2' },
  { s: '4area', what: 'function', c: 'f3' },
  { s: 'E', what: '…end', c: 'f1' },
  { s: 'd', what: 'a double', c: 'f5' },
];

export default function ManglingFigure() {
  const w = [34, 26, 64, 74, 26, 30];
  let x = 200 - w.reduce((a, b) => a + b, 0) / 2;
  return (
    <Svg w={400} h={176} title="The symbol _ZN3geo4areaEd split into its parts: _Z, N, 3geo, 4area, E and d">
      <T x={200} y={16} size={13} mono anchor="middle">double geo::area(double r)</T>
      <T x={200} y={38} size={11} anchor="middle" fill={tok('muted')}>compiles to the one symbol</T>
      {PARTS.map((p, k) => {
        const bx = x;
        x += w[k] + 4;
        const tall = k % 2 === 0;
        return (
          <g key={p.s}>
            <Box x={bx} y={54} w={w[k]} h={30} fill={tok(p.c, 0.15)} stroke={tok(p.c)}>
              <T x={bx + w[k] / 2} y={69} size={13} mono anchor="middle">{p.s}</T>
            </Box>
            <path d={`M${bx + w[k] / 2},84 L${bx + w[k] / 2},${tall ? 104 : 132}`} stroke={tok('ink', 0.4)} strokeWidth={1} />
            <T x={bx + w[k] / 2} y={tall ? 114 : 142} size={11} anchor="middle" fill={tok('muted')}>{p.what}</T>
          </g>
        );
      })}
      <T x={200} y={166} size={11} anchor="middle" fill={tok('muted')}>Each name is written as its length, then its letters.</T>
    </Svg>
  );
}
