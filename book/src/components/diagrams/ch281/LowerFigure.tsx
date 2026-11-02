import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 281: the same source expression p + q, and what three compilers
// turn it into (real output: clang++ 18 -O0, rustc 1.97 --emit=mir,
// Python 3.13 dis). C++ and Rust choose the function from the types while
// compiling; Python chooses while running.
const ROWS = [
  { lang: 'C++', out: 'call _Zpl1VS_', sub: 'operator+(V, V), by type', c: 'f1' },
  { lang: 'Rust', out: '<V as Add>::add(p, q)', sub: 'the Add trait’s method', c: 'f2' },
  { lang: 'Python', out: 'BINARY_OP 0 (+)', sub: 'looks up __add__ at run time', c: 'f5' },
];

export default function LowerFigure() {
  return (
    <Svg w={400} h={200} title="p + q becomes a call of operator+ in C++, a call of Add::add in Rust, and a BINARY_OP instruction in Python">
      <Box x={8} y={78} w={80} h={40} fill={tok('brand', 0.12)} stroke={tok('brand')}>
        <T x={48} y={98} size={14} mono anchor="middle">p + q</T>
      </Box>
      {ROWS.map((r, k) => {
        const y = 14 + k * 64;
        return (
          <g key={r.lang}>
            <Arrow x1={90} y1={98} x2={140} y2={y + 22} />
            <Box x={142} y={y} w={250} h={46} fill={tok(r.c, 0.12)} stroke={tok(r.c)}>
              <T x={152} y={y + 15} size={11} weight={700} fill={tok('muted')}>{r.lang}</T>
              <T x={200} y={y + 15} size={12} mono>{r.out}</T>
              <T x={152} y={y + 34} size={11} fill={tok('muted')}>{r.sub}</T>
            </Box>
          </g>
        );
      })}
    </Svg>
  );
}
