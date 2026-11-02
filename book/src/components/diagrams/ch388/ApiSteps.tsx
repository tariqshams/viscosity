import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';

// Chapter 388: one signature improved a guideline at a time, after the
// Rust API Guidelines (C-GENERIC, C-CUSTOM-TYPE, C-COMMON-TRAITS) and
// the Rust Reference on #[non_exhaustive]. Clippy's ptr_arg lint gave
// the &String advice ("writing `&String` instead of `&str` involves a
// new object where a slice will do") with clippy 0.1.97.
type S = { code: string; line: number | null; call: string; note: string };

const STATES: S[] = [
  {
    code: `pub fn greet(name: &String,
             loud: bool) -> String`,
    line: null,
    call: `greet(&"Ada".to_string(), true)`,
    note: 'It works, but look at the call: the literal "Ada" must be turned into a String just to be borrowed, and nobody reading true knows what it means.',
  },
  {
    code: `pub fn greet(name: &str,
             loud: bool) -> String`,
    line: 0,
    call: `greet("Ada", true)`,
    note: 'Ask for the least you need (C-GENERIC): &str. A &String still works, because it converts to &str automatically, and literals work directly. Clippy suggests the same change (ptr_arg).',
  },
  {
    code: `pub enum Volume { Quiet, Loud }

pub fn greet(name: &str,
             v: Volume) -> String`,
    line: 3,
    call: `greet("Ada", Volume::Loud)`,
    note: 'Replace the bool with a type that says what it means (C-CUSTOM-TYPE). The call reads aloud, and swapping two bools by mistake is no longer possible.',
  },
  {
    code: `#[derive(Debug, Clone, Copy,
         PartialEq, Eq, Hash)]
pub enum Volume { Quiet, Loud }`,
    line: 0,
    call: `println!("{:?}", Volume::Loud)`,
    note: 'Derive the common traits now (C-COMMON-TRAITS). Users cannot add them later: by the orphan rule an impl must live with the trait or the type.',
  },
  {
    code: `#[non_exhaustive]
#[derive(Debug, Clone, Copy,
         PartialEq, Eq, Hash)]
pub enum Volume { Quiet, Loud }`,
    line: 0,
    call: `match v { Volume::Loud => .., _ => .. }`,
    note: 'Leave room to grow: with #[non_exhaustive], other crates must match with a _ arm, so adding Whisper later breaks nobody.',
  },
];

export default function ApiSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Improving one signature" steps={s} note={st.note}>
      <CodeTrace code={st.code} line={st.line} />
      <div className="mt-2 text-xs font-bold uppercase tracking-[0.08em] text-muted">a caller writes</div>
      <CodeTrace code={st.call} line={null} />
    </StepFrame>
  );
}
