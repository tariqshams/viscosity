import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';

// Chapter 330b: what cargo test does with one doc example, following
// the rustdoc book's "Pre-processing examples" (insert common allows,
// add `extern crate <mycrate>;`, wrap in `fn main` if there is none)
// and "Hiding portions of the example" (`# ` lines compiled, not
// shown). The test name and result are what cargo 1.97.0 printed for
// the chapter's colors crate.
type S = { code: string; line: number | null; note: string };

const STATES: S[] = [
  {
    code: `/// # Examples
///
/// \`\`\`
/// # use colors::*;
/// let c = parse_rgb("#ff8800");
/// assert_eq!(c, Ok((255, 136, 0)));
/// \`\`\``,
    line: 2,
    note: 'The doc comment, as written in lib.rs. The fenced block starting on line 18 of the file is Rust, so it is a doc test.',
  },
  {
    code: `let c = parse_rgb("#ff8800");
assert_eq!(c, Ok((255, 136, 0)));`,
    line: null,
    note: 'What cargo doc shows a reader: the line starting with "# " is hidden. Readers see only the two lines that teach something.',
  },
  {
    code: `use colors::*;
let c = parse_rgb("#ff8800");
assert_eq!(c, Ok((255, 136, 0)));`,
    line: 0,
    note: 'What cargo test compiles: the hidden line is back, with its "# " removed. It is needed, because the example is not inside your crate.',
  },
  {
    code: `#![allow(unused)]
extern crate colors;
fn main() {
    use colors::*;
    let c = parse_rgb("#ff8800");
    assert_eq!(c, Ok((255, 136, 0)));
}`,
    line: 2,
    note: 'rustdoc adds a few allow attributes, links your crate with extern crate, and, as there is no fn main, wraps the code in one. It is now a small program that uses your public API like any user would. (Simplified: the real allow list is longer.)',
  },
  {
    code: `test src/lib.rs - parse_rgb (line 18) ... ok
test result: ok. 1 passed; 0 failed`,
    line: 0,
    note: 'The program is compiled and run. It returned normally, so the test passes. Had the assert failed, the program would panic and the test would fail, exactly like a #[test].',
  },
];

export default function DoctestSteps() {
  const s = useSteps(STATES);
  return (
    <StepFrame title="From doc comment to test" steps={s} note={s.state.note}>
      <CodeTrace code={s.state.code} line={s.state.line} />
    </StepFrame>
  );
}
