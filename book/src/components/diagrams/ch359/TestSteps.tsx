import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 359: the test binaries `cargo test` builds for drip-rs, in the
// order it runs them, with the counts from a real run (rustc/cargo 1.97,
// book/companion/rust, 2026-11-02): 13 unit tests, 0 in main.rs, 334
// corpus programs, 165 stress-GC programs, 6 integration tests, 0 doc-tests.
type Row = { id: string; what: string; file: string; n: string; sees: string; own?: boolean };

const ROWS: Row[] = [
  { id: 'lib', what: 'unit tests', file: 'src/*.rs  #[cfg(test)]', n: '13', sees: 'everything, private too' },
  { id: 'main', what: 'unit tests', file: 'src/main.rs', n: '0', sees: 'the binary’s own code' },
  { id: 'corpus', what: 'integration', file: 'tests/corpus.rs', n: '334', sees: 'only pub items of drip', own: true },
  { id: 'gc', what: 'integration', file: 'tests/stress_gc.rs', n: '165', sees: 'only pub items of drip', own: true },
  { id: 'vm', what: 'integration', file: 'tests/vm.rs', n: '6', sees: 'only pub items of drip' },
  { id: 'doc', what: 'doc-tests', file: 'code in /// comments', n: '0', sees: 'only pub items of drip' },
];

type S = { at: number | null; note: string };

const STATES: S[] = [
  { at: null, note: 'cargo test builds several separate test programs and runs them one after another. For drip-rs there are six. Each prints its own summary.' },
  { at: 0, note: 'First the library, compiled again with cfg(test) switched on, so every #[cfg(test)] mod tests is included. Those modules are children of the code they test, so they can call private functions.' },
  { at: 1, note: 'The binary crate gets the same treatment. drip-rs’s main.rs has no tests, so this one reports 0 passed.' },
  { at: 2, note: 'Each file in tests/ is its own crate that depends on drip, like any user would. corpus.rs is declared with harness = false: it has its own main, which runs 334 Drip programs and prints one line each.' },
  { at: 3, note: 'stress_gc.rs is the same runner with collection before every allocation, over 165 programs that work the heap hardest. Both share tests/common/mod.rs, which is a module, not a test crate.' },
  { at: 4, note: 'vm.rs is an ordinary integration test: six #[test] functions run by the standard harness, using drip’s public API (Vm, Options, compile).' },
  { at: 5, note: 'Last come doc-tests: code examples in /// comments, compiled and run. drip-rs has none, so 0. If any binary fails, cargo test exits with failure.' },
];

export default function TestSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="What cargo test runs" steps={s} note={st.note}>
      <Svg w={400} h={244} title="The six test binaries cargo test builds for drip-rs, with test counts">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>test binary</T>
        <T x={296} y={12} size={11} weight={700} fill={tok('muted')} anchor="end">tests</T>
        {ROWS.map((r, k) => {
          const y = 22 + k * 36;
          const on = st.at === k;
          const done = st.at !== null && k < st.at;
          return (
            <g key={r.id}>
              <Box x={4} y={y} w={392} h={33} r={4} fill={on ? tok('brand', 0.18) : tok('panel')} stroke={on ? tok('brand') : tok('line')} opacity={st.at === null || on || done ? 1 : 0.75}>
                <T x={12} y={y + 10} size={11} mono weight={700}>{r.file}</T>
                <T x={12} y={y + 24} size={11} fill={tok('muted')}>{r.what} · sees {r.sees}</T>
                <T x={296} y={y + 16} size={12} mono anchor="end" weight={700}>{r.n}</T>
                {r.own && (
                  <T x={304} y={y + 16} size={11} mono fill={tok('accent')}>harness=false</T>
                )}
              </Box>
            </g>
          );
        })}
      </Svg>
    </StepFrame>
  );
}
