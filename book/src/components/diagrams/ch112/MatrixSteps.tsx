import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// How Viscosity's test programs multiply into checks. Counts are from the
// repository: 28 JS corpus files, 5 end-to-end programs, 11 Python corpus
// files, and `npx vitest run` in engine/ts reporting 94 tests (run for
// chapter 112). The Rust fixtures exist; the Rust parity test does not yet.
const ROWS = [
  { name: 'JS corpus', n: 28 },
  { name: 'e2e programs', n: 5 },
  { name: 'Python corpus', n: 11 },
];
const COLS = ['decision', 'behaviour', 'two parsers', 'Rust fixtures'];

// cell[r][c]: the step at which it is filled, or null if it doesn't apply
const CELL: (number | null)[][] = [
  [1, 1, 2, 5],
  [null, 4, 2, 5],
  [3, 3, null, null],
];
const TEXT: string[][] = [
  ['header', 'fresh VM', 'acorn = mini', '×2 modes'],
  ['', 'checksum', 'acorn = mini', '×2 modes'],
  ['header', 'python3', '', ''],
];

const STATES: { k: number; total: string; note: string }[] = [
  { k: 0, total: 'programs: 44', note: 'The raw material: 28 small JavaScript corpus files, 5 end-to-end benchmark programs, and 11 Python corpus files. Each row is a folder of programs; each column is a kind of check.' },
  { k: 1, total: '29 tests', note: 'differential.test.ts: for each JS corpus file, check every decision against the header, then compare the original and compiled runs in fresh VM contexts. 28 tests, plus the round-trip identity test.' },
  { k: 2, total: '29 + 35 tests', note: 'mini-parser.test.ts: for every corpus file AND every benchmark program, the hand-written parser must give byte-identical code and reports to acorn. 33 tests, plus 2 targeted ones.' },
  { k: 3, total: '29 + 35 + 12 tests', note: 'The Python differential test runs each original and compiled program with real python3 and compares stdout and the final exception line. 11 tests, plus one for the default policy.' },
  { k: 4, total: 'all: 94 tests', note: 'Outside the test suite, the end-to-end benchmark is a behaviour check too: its checksums must match. Back in the suite, add 10 core unit tests (SSA, CFG, analyses) and 8 layout tests: 29 + 35 + 12 + 10 + 8 = 94 tests, all passing.' },
  { k: 5, total: '+ 132 fixture files', note: 'For the Rust port: every JS program is compiled in both bounds modes, and the code and report are stored. 33 × 2 × 2 = 132 files. The Rust test that will compare against them is Part XI’s job.' },
  { k: 6, total: 'one new file: +2 tests', note: 'Add one JS corpus file: it gets a differential test and a parser test, and 4 Rust fixtures, with zero lines of new test code. The tests are generated from the folder listing.' },
];

export default function MatrixSteps() {
  const s = useSteps(STATES);
  const k = s.state.k;
  const x0 = 104;
  const cw = 72;
  const y0 = 46;
  const rh = 58;
  return (
    <StepFrame title="A scaled differential testing matrix" steps={s} note={s.state.note}>
      <Svg w={400} h={290} title="A grid: rows are the JavaScript corpus, the end-to-end programs and the Python corpus; columns are the decision check, the behaviour check, the two-parser check and the Rust fixtures. Cells fill in step by step.">
        {COLS.map((c, j) => (
          <T key={c} x={x0 + j * cw + cw / 2} y={30} size={10} weight={700} anchor="middle" fill={tok('muted')}>{c}</T>
        ))}
        {ROWS.map((r, i) => {
          const y = y0 + i * rh;
          const extra = k === 6 && i === 0;
          return (
            <g key={r.name}>
              <T x={6} y={y + 18} size={11} weight={700}>{r.name}</T>
              <T x={6} y={y + 34} size={11} mono fill={extra ? tok('brand') : tok('muted')}>{`${extra ? r.n + 1 : r.n} files`}</T>
              {COLS.map((_, j) => {
                const at = CELL[i][j];
                const on = at !== null && k >= at;
                const now = at === k || (k === 6 && i === 0 && at !== null);
                const future = at === 5;
                return (
                  <Box key={j} x={x0 + j * cw + 2} y={y + 2} w={cw - 4} h={rh - 6}
                    fill={at === null ? 'transparent' : now ? tok('brand', 0.18) : on ? tok(future ? 'warn' : 'safe', 0.12) : 'transparent'}
                    stroke={at === null ? tok('line', 0.4) : on ? tok(future ? 'warn' : 'safe') : tok('line')} dash={at === null || !on || future}>
                    <T x={x0 + j * cw + cw / 2} y={y + 20} size={14} anchor="middle" fill={on ? (future ? tok('warn') : tok('safe')) : tok('muted')}>{at === null ? '—' : on ? (future ? '◇' : '✓') : '·'}</T>
                    <T x={x0 + j * cw + cw / 2} y={y + 38} size={9} anchor="middle" fill={tok('muted')}>{on ? TEXT[i][j] : ''}</T>
                  </Box>
                );
              })}
            </g>
          );
        })}
        <Box x={6} y={232} w={388} h={46} fill={tok('panel')}>
          <T x={16} y={248} size={10} weight={700} fill={tok('muted')}>SO FAR</T>
          <T x={16} y={266} size={13} mono weight={700}>{s.state.total}</T>
          <T x={384} y={266} size={9} anchor="end" fill={tok('muted')}>◇ stored, not yet compared</T>
        </Box>
      </Svg>
    </StepFrame>
  );
}
