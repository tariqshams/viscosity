// Chapter 250: a two-instruction window sliding over a short fragment of
// unoptimised RISC-V, applying three rules until nothing matches.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

type S = { lines: string[]; win: number; hit?: number[]; rule?: string[]; note: string };
const A = ['sd   a0, -24(s0)', 'ld   a0, -24(s0)', 'mul  a0, a0, a0', 'addi a0, a0, 0', 'j    next', 'next:', 'ret'];
const B = ['sd   a0, -24(s0)', 'mul  a0, a0, a0', 'addi a0, a0, 0', 'j    next', 'next:', 'ret'];
const C = ['sd   a0, -24(s0)', 'mul  a0, a0, a0', 'j    next', 'next:', 'ret'];
const D = ['sd   a0, -24(s0)', 'mul  a0, a0, a0', 'next:', 'ret'];
const STATES: S[] = [
  { lines: A, win: -1, note: 'Seven lines of the kind a simple code generator leaves behind. The window is two instructions wide; we slide it from the top, and at each position check our three rules.' },
  { lines: A, win: 0, hit: [1], rule: ['1: store, then load', 'the same slot into', 'the same register'], note: 'Lines 0 and 1: a0 is stored to -24(s0) and loaded straight back into a0. a0 already holds that value, so the load does nothing. Rule 1 deletes it.' },
  { lines: B, win: 0, note: 'The window stays where it is, because a deletion can line up a new pair. sd then mul: no rule matches. Slide on.' },
  { lines: B, win: 1, hit: [2], rule: ['2: addi r, r, 0', 'changes nothing'], note: 'mul then addi a0, a0, 0. Adding 0 to a register and putting it back is a no-op. Rule 2 deletes it.' },
  { lines: C, win: 1, note: 'mul then j next: no rule matches. Slide on.' },
  { lines: C, win: 2, hit: [2], rule: ['3: a jump to the', 'very next line'], note: 'j next, and the next line is the label next. Jumping to where you would have gone anyway does nothing. Rule 3 deletes the jump.' },
  { lines: D, win: 2, note: 'next: then ret, and nothing else matches. A full pass made no more changes, so we stop. Seven lines became four.' },
  { lines: D, win: 0, note: 'Note what stayed: the store to -24(s0). It is useless if nothing ever reads that slot again, but that depends on code far outside the window, so a peephole rule cannot know. Removing it is a job for liveness.' },
];

export default function PeepholeSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="A peephole sliding over code" steps={s} note={st.note}>
      <Svg w={400} h={232} title="A list of instructions with a two-line window drawn around the current pair; lines that a rule deletes are struck through.">
        {st.lines.map((l, k) => {
          const y = 10 + k * 28;
          const hit = st.hit?.includes(k);
          return (
            <g key={k}>
              <T x={14} y={y + 12} size={11} mono fill={tok('muted')}>{k}</T>
              <T x={34} y={y + 12} size={13} mono fill={hit ? tok('danger') : tok('ink')}>{l}</T>
              {hit && <line x1={32} x2={190} y1={y + 12} y2={y + 12} stroke={tok('danger')} strokeWidth={2} />}
            </g>
          );
        })}
        {st.win >= 0 && st.win < st.lines.length - 1 && (
          <Box x={26} y={4 + st.win * 28} w={176} h={56} fill="transparent" stroke={tok('brand')} r={6} />
        )}
        {st.rule && (
          <g>
            <T x={214} y={20} size={11} weight={700} fill={tok('muted')}>RULE THAT MATCHED</T>
            {st.rule.map((r, k) => (
              <T key={k} x={214} y={40 + k * 17} size={12} fill={tok('danger')} weight={700}>{r}</T>
            ))}
          </g>
        )}
      </Svg>
    </StepFrame>
  );
}
