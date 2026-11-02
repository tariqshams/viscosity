import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 323: the parity loop in engine/rust. scripts/gen_expected.mjs
// runs the TypeScript compiler and writes fixtures to tests/expected;
// crates/cli/tests/parity.rs compiles the same sources with the Rust
// engine and compares bytes; differential.rs runs both programs in node.
// The last two steps show real output with one line of builder.rs removed
// (run on a copy of the repo, not committed).
type Hi = 'none' | 'ts' | 'fix' | 'rust' | 'cmp' | 'node';
type S = { hi: Hi[]; verdict?: string; bad?: boolean; note: string };

const STATES: S[] = [
  { hi: ['none'], note: 'One test program, say corpus/throw_from_loop.js. Every program is compiled twice: with default options, and with --bounds assume, which takes the unchecked emit paths.' },
  { hi: ['ts', 'fix'], note: 'Once, by hand, with Node: gen_expected.mjs runs the TypeScript reference and writes four files per program (code and explain text, for each variant) into tests/expected. They are committed.' },
  { hi: ['rust', 'cmp'], verdict: 'parity: 190/190 (54 Python)', note: 'On every cargo test: parity.rs compiles the same sources with the Rust engine and compares with the fixtures, byte for byte. Node isn’t needed for this part.' },
  { hi: ['fix'], verdict: 'no missing, no stale fixtures', note: 'A second test checks the fixture folder itself: every program has its files and no file is left over. Otherwise a deleted program would leave a fixture nobody checks.' },
  { hi: ['node'], verdict: 'differential: 68/68 identical', note: 'Byte equality says the engines agree, not that they are right. The differential test runs each original and compiled program with node and compares what they print and throw.' },
  { hi: ['rust', 'cmp'], bad: true, verdict: '4 of 186 differ', note: 'Delete one line from the Rust builder (the throw case of trivial-phi removal) and parity fails on exactly this program: both variants, code and explain (run when there were 186 pairs). The Rust engine now says “struct of arrays”.' },
  { hi: ['node'], bad: true, verdict: 'object 1  vs  number undefined', note: 'The differential test fails too, and says why it matters: the compiled program throws an index (a number) where the original threw the object.' },
];

const B = {
  src: { x: 140, y: 8, w: 120, h: 30, label: 'program.js' },
  ts: { x: 10, y: 70, w: 150, h: 30, label: 'TS: gen_expected.mjs' },
  fix: { x: 10, y: 130, w: 150, h: 30, label: 'tests/expected/*' },
  rust: { x: 240, y: 70, w: 150, h: 30, label: 'Rust: parity.rs' },
  cmp: { x: 140, y: 190, w: 120, h: 30, label: 'bytes equal?' },
  node: { x: 270, y: 130, w: 125, h: 30, label: 'node: run both' },
} as const;

export default function ParitySteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const on = (k: Hi) => st.hi.includes(k);
  const col = (k: Hi) => (on(k) ? (st.bad ? tok('danger') : tok('brand')) : tok('line'));
  const box = (k: keyof typeof B) => {
    const b = B[k];
    return (
      <Box key={k} x={b.x} y={b.y} w={b.w} h={b.h} r={4} fill={on(k as Hi) ? (st.bad ? tok('danger', 0.12) : tok('brand', 0.15)) : tok('panel')} stroke={col(k as Hi)}>
        <T x={b.x + b.w / 2} y={b.y + b.h / 2} size={11} mono anchor="middle">{b.label}</T>
      </Box>
    );
  };
  return (
    <StepFrame title="Two engines, one set of fixtures" steps={s} note={st.note}>
      <Svg w={400} h={270} title="The TypeScript engine writes fixtures; the Rust engine is compared with them; node runs both outputs">
        <Arrow x1={170} y1={38} x2={90} y2={68} color={tok('ink', 0.4)} width={1.5} />
        <Arrow x1={230} y1={38} x2={310} y2={68} color={tok('ink', 0.4)} width={1.5} />
        <Arrow x1={85} y1={100} x2={85} y2={128} color={tok('ink', 0.4)} width={1.5} />
        <Arrow x1={85} y1={160} x2={160} y2={188} color={tok('ink', 0.4)} width={1.5} />
        <Arrow x1={255} y1={100} x2={240} y2={188} color={tok('ink', 0.4)} width={1.5} />
        <Arrow x1={330} y1={100} x2={330} y2={128} color={tok('ink', 0.4)} width={1.5} />
        {(Object.keys(B) as (keyof typeof B)[]).map(box)}
        {st.verdict && (
          <T x={200} y={248} size={12} mono anchor="middle" fill={st.bad ? tok('danger') : tok('safe')}>{st.verdict}</T>
        )}
      </Svg>
    </StepFrame>
  );
}
