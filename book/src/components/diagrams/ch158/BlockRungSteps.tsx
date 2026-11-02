import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 158b: the AoSoA annotation rungs of plan_one in
// engine/rust/crates/core/src/plan.rs, rewrapped, run on six annotations.
// Every verdict is the real first explain line of the release CLI
// (rustc 1.97) for the chapter's {x, y, vx} program with that annotation;
// the TypeScript CLI printed the same bytes for each.
const CODE = `let b = match (&ann.block_text,
               ann.block_size) {
    (Some(_), None) => None,
    (_, b) => Some(b.unwrap_or(8)),
};
if b.is_some_and(|b| b > MAX_BLOCK_SIZE) {
    return keep(/* at most 65536 */);
}
if !b.is_some_and(|b| b >= 2
        && b.is_power_of_two()) {
    return keep(/* a power of two */);
}`;

type S = { line: number | null; ann: string; text: string; size: string; b: string; verdict: string; ok?: boolean; note: string };

const STATES: S[] = [
  { line: null, ann: '', text: '', size: '', b: '', verdict: '', note: 'parse_annotation hands the planner two things: block_text, what was written between the brackets (if there were brackets), and block_size, that text as a whole number (if it is one). The rungs turn them into b, an Option<u64>.' },
  { line: 3, ann: 'aosoa(4)', text: 'Some("4")', size: 'Some(4)', b: 'Some(4)', verdict: 'AoSoA, blocks of 4', ok: true, note: 'A number was written, so the second arm applies and b is Some(4). 4 is at most 65536, at least 2, and a power of two: both rungs pass.' },
  { line: 10, ann: 'aosoa(6)', text: 'Some("6")', size: 'Some(6)', b: 'Some(6)', verdict: 'must be a power of two', note: '6 is small enough, but 6 is 0b110: two bits set. The second rung returns keep(...) with “annotated aosoa(6), but the block size must be a power of two (2, 4, 8, 16, ...)”.' },
  { line: 10, ann: 'aosoa(1)', text: 'Some("1")', size: 'Some(1)', b: 'Some(1)', verdict: 'must be a power of two', note: '1 is 2⁰, so 1.is_power_of_two() is true. The b >= 2 test is what refuses it: a block of one element is no block at all.' },
  { line: 2, ann: 'aosoa(x)', text: 'Some("x")', size: 'None', b: 'None', verdict: 'must be a power of two', note: 'Something was written, but it isn’t a whole number: the first arm makes b None, and is_some_and on None is false, so the second rung refuses, quoting the text as written.' },
  { line: 3, ann: 'aosoa', text: 'None', size: 'None', b: 'Some(8)', verdict: 'AoSoA, blocks of 8', ok: true, note: 'No brackets at all: the second arm, with unwrap_or(8). Leaving the size out means the default; writing something wrong does not.' },
  { line: 6, ann: 'aosoa(131072)', text: 'Some("131072")', size: 'Some(131072)', b: 'Some(131072)', verdict: 'must be at most 65536', note: '2¹⁷ is a power of two, but bigger than MAX_BLOCK_SIZE (2¹⁶). The size limit is checked first, so its message wins.' },
];

export default function BlockRungSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Which block sizes get through?" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={96} title="The annotation, what the parser found, b, and the verdict">
        {st.ann && (
          <g>
            <T x={6} y={12} size={11} mono weight={700}>{`// @viscosity ${st.ann}`}</T>
            <T x={6} y={32} size={11} fill={tok('muted')}>block_text</T>
            <T x={90} y={32} size={11} mono>{st.text}</T>
            <T x={220} y={32} size={11} fill={tok('muted')}>block_size</T>
            <T x={300} y={32} size={11} mono>{st.size}</T>
            <T x={6} y={52} size={11} fill={tok('muted')}>b</T>
            <T x={90} y={52} size={11} mono>{st.b}</T>
            <Box x={4} y={64} w={392} h={26} fill={st.ok ? tok('safe', 0.14) : tok('warn', 0.16)} stroke={st.ok ? tok('safe') : tok('warn')}>
              <T x={200} y={77} size={12} anchor="middle" weight={700}>{st.verdict}</T>
            </Box>
          </g>
        )}
      </Svg>
    </StepFrame>
  );
}
