// Chapter 411: one corpus, many checkers. Counts measured for the chapter
// on 2026-11-02: book/companion/corpus holds 344 .drip files in 25
// folders (334 tests plus 10 benchmarks); cargo test runs 334 in
// tests/corpus.rs and 165 in tests/stress_gc.rs; node
// scripts/compare_with_ts.mjs 2000 compared 343 programs (one reads the
// clock) and 2000 mangled ones; node test/fuzz.mjs 2000 (in ../ts)
// compared the tree-walker's and the VM's compile errors on 2000.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const ROWS = [
  { name: 'ts/test/corpus.ts', what: 'tree-walker and TS VM', n: 'every test', col: 'accent' },
  { name: 'tests/corpus.rs', what: 'drip-rs, debug_gc', n: '334 ok', col: 'brand' },
  { name: 'tests/stress_gc.rs', what: 'collect before each alloc', n: '165 ok', col: 'brand' },
  { name: 'compare_with_ts.mjs', what: 'drip-rs vs TS VM, bytes', n: '343 + 2000', col: 'safe' },
  { name: 'ts/test/fuzz.mjs', what: 'compile errors, two TS', n: '2000', col: 'warn' },
];

export default function CorpusFan() {
  return (
    <Svg w={400} h={306} title="One corpus of Drip programs, read by five different checkers">
      <Box x={110} y={4} w={180} h={44} r={6} fill={tok('brand', 0.12)} stroke={tok('brand')}>
        <T x={200} y={19} size={12} weight={700} anchor="middle">book/companion/corpus</T>
        <T x={200} y={36} size={11} mono anchor="middle" fill={tok('muted')}>344 programs, 25 folders</T>
      </Box>
      <path d={`M110,26 H10 V${70 + 4 * 44 + 18}`} fill="none" stroke={tok('ink', 0.5)} strokeWidth={1.5} />
      {ROWS.map((r, i) => {
        const y = 70 + i * 44;
        return (
          <g key={r.name}>
            <Arrow x1={10} y1={y + 18} x2={22} y2={y + 18} color={tok('ink', 0.5)} width={1.5} />
            <Box x={22} y={y} w={374} h={36} r={4} fill={tok(r.col, 0.1)} stroke={tok(r.col)}>
              <T x={30} y={y + 12} size={12} mono weight={700}>{r.name}</T>
              <T x={30} y={y + 27} size={11} fill={tok('muted')}>{r.what}</T>
              <T x={388} y={y + 19} size={12} mono weight={700} anchor="end" fill={tok(r.col)}>{r.n}</T>
            </Box>
          </g>
        );
      })}
      <T x={4} y={298} size={11} fill={tok('muted')}>The expectations live in the programs; every checker reads the same files.</T>
    </Svg>
  );
}
