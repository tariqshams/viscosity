import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// How Viscosity's test programs multiply into checks. Every count is from
// the repository as it stands: 40 JS corpus files, 5 end-to-end programs,
// 20 Python corpus files; `npx vitest run` in engine/ts reports 147 tests in
// 6 files; engine/rust/tests/expected holds 402 fixture files (190 code and
// explain pairs, 14 code frames, 4 profiled pairs), and the Rust parity test
// printed "parity: 190/190 (54 Python)"; `node scripts/fuzz.mjs` (seed 1)
// checked 300 random programs with 0 failing.
const ROWS = [
  { name: 'JS corpus', n: '40 files' },
  { name: 'e2e programs', n: '5 files' },
  { name: 'Python corpus', n: '20 files' },
  { name: 'random', n: '300 a run' },
];
const COLS = ['decision', 'behaviour', 'two parsers', 'Rust port'];

// CELL[r][c]: the step at which the cell fills in, or null if it does not apply
const CELL: (number | null)[][] = [
  [1, 1, 2, 5],
  [null, 4, 2, 5],
  [3, 3, null, 5],
  [null, 7, null, 7],
];
const TEXT: string[][] = [
  ['header', 'fresh VM', 'acorn=mini', 'fixtures'],
  ['', 'checksum', 'acorn=mini', 'fixtures'],
  ['header', 'python3', '', 'fixtures'],
  ['', 'both modes', '', 'live'],
];

const STATES: { k: number; total: string; note: string }[] = [
  { k: 0, total: 'programs: 40 + 5 + 20', note: 'The raw material: 40 small JavaScript corpus files, 5 end-to-end benchmark programs and 20 Python corpus files. Each row is a folder of programs; each column is a kind of check.' },
  { k: 1, total: '42 tests', note: 'differential.test.ts: for each JS corpus file, check every decision against the header, then compare the original and compiled runs in fresh VM contexts. 40 generated tests, plus two round-trip identity tests.' },
  { k: 2, total: '42 + 47 tests', note: 'mini-parser.test.ts: for every corpus file AND every benchmark program, the hand-written parser must give byte-identical code and reports to acorn. 45 generated tests, plus 2 targeted ones.' },
  { k: 3, total: '42 + 47 + 21 tests', note: 'The Python differential test runs each original and compiled program with the real python3 and compares standard output and the final exception line. 20 generated tests, plus one for the default policy.' },
  { k: 4, total: 'all: 147 tests', note: 'The benchmark’s checksums are a behaviour check too, outside the suite. Inside it, add 15 core unit tests, 8 layout tests and 14 command-line tests: 42 + 47 + 21 + 15 + 8 + 14 = 147, of which 105 are generated from folders.' },
  { k: 5, total: '+ 402 fixture files', note: 'For the Rust port, the TypeScript engine compiles every program (with the Python benchmark and 29 programs written for the port, 95 in all) in both bounds modes and stores code and report: 190 pairs, plus 14 code frames and 4 profiled pairs. The parity test matched all 190.' },
  { k: 6, total: 'one new file: +2 tests', note: 'Add one JS corpus file: it gets a differential test and a parser test with zero lines of new test code, and, once the fixture script is rerun, 4 more Rust fixture files. The tests are generated from the folder listing.' },
  { k: 7, total: '+ 300 random programs', note: 'The last row is nobody’s file: the fuzzer writes 300 programs in its default run (seed 1), checks behaviour in both bounds modes, and compares the two engines live. Each bug it finds becomes a new corpus file in the first row.' },
];

export default function MatrixSteps() {
  const s = useSteps(STATES);
  const k = s.state.k;
  const x0 = 104;
  const cw = 72;
  const y0 = 42;
  const rh = 50;
  const yTotal = y0 + ROWS.length * rh + 8;
  return (
    <StepFrame title="A differential testing matrix, at scale" steps={s} note={s.state.note}>
      <Svg w={400} h={yTotal + 52} title="A grid: rows are the JavaScript corpus, the end-to-end programs, the Python corpus and random programs; columns are the decision check, the behaviour check, the two-parser check and the Rust port. Cells fill in step by step.">
        {COLS.map((c, j) => (
          <T key={c} x={x0 + j * cw + cw / 2} y={28} size={11} weight={700} anchor="middle" fill={tok('muted')}>{c}</T>
        ))}
        {ROWS.map((r, i) => {
          const y = y0 + i * rh;
          const grew = k === 6 && i === 0;
          return (
            <g key={r.name}>
              <T x={6} y={y + 16} size={12} weight={700}>{r.name}</T>
              <T x={6} y={y + 32} size={11} mono fill={grew ? tok('brand') : tok('muted')}>{grew ? '41 files' : r.n}</T>
              {COLS.map((_, j) => {
                const at = CELL[i][j];
                const on = at !== null && k >= at;
                const now = at === k || (grew && at !== null);
                return (
                  <Box key={j} x={x0 + j * cw + 2} y={y + 2} w={cw - 4} h={rh - 6}
                    fill={at === null ? 'transparent' : now ? tok('brand', 0.18) : on ? tok('safe', 0.12) : 'transparent'}
                    stroke={at === null ? tok('line', 0.4) : on ? tok('safe') : tok('line')} dash={at === null || !on}>
                    <T x={x0 + j * cw + cw / 2} y={y + 16} size={14} anchor="middle" fill={on ? tok('safe') : tok('muted')}>{at === null ? '–' : on ? '✓' : '·'}</T>
                    <T x={x0 + j * cw + cw / 2} y={y + 33} size={11} anchor="middle" fill={tok('muted')}>{on ? TEXT[i][j] : ''}</T>
                  </Box>
                );
              })}
            </g>
          );
        })}
        <Box x={6} y={yTotal} w={388} h={44} fill={tok('panel')}>
          <T x={16} y={yTotal + 14} size={11} weight={700} fill={tok('muted')}>SO FAR</T>
          <T x={16} y={yTotal + 32} size={13} mono weight={700}>{s.state.total}</T>
        </Box>
      </Svg>
    </StepFrame>
  );
}
