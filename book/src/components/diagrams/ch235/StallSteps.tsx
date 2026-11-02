// Chapter 235: the sum-of-squares loop body on the book's toy machine
// (one instruction per cycle, in order; ld and mul take 3 cycles, the
// rest 1), first in the order instruction selection left it, then in the
// order clang chose. Each step issues one more instruction.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

type Row = { text: string; at: number };
const PLAIN: Row[] = [
  { text: 'ld   a3, 0(a0)', at: 0 },
  { text: 'mul  a3, a3, a3', at: 3 },
  { text: 'add  a2, a3, a2', at: 6 },
  { text: 'addi a0, a0, 8', at: 7 },
  { text: 'bne  a0, a1, loop', at: 8 },
];
const CLANG: Row[] = [
  { text: 'ld   a3, 0(a0)', at: 0 },
  { text: 'mul  a3, a3, a3', at: 3 },
  { text: 'addi a0, a0, 8', at: 4 },
  { text: 'add  a2, a3, a2', at: 6 },
  { text: 'bne  a0, a1, loop', at: 7 },
];

type S = { rows: Row[]; shown: number; label: string; note: string };
const STATES: S[] = [
  { rows: PLAIN, shown: 0, label: 'as selected', note: 'The loop body as instruction selection left it: load x, square it, add it to the sum, move the pointer on, loop. Our toy machine starts at most one instruction per cycle, in this order.' },
  { rows: PLAIN, shown: 1, label: 'as selected', note: 'Cycle 0: ld starts. Its value will not be in a3 until cycle 3, because a load takes three cycles.' },
  { rows: PLAIN, shown: 2, label: 'as selected', note: 'mul needs a3, so it cannot start until cycle 3. Cycles 1 and 2 are stalls: the machine sits idle (shaded).' },
  { rows: PLAIN, shown: 3, label: 'as selected', note: 'add needs the product, which a multiply also takes three cycles to make. Two more stalls; add starts in cycle 6.' },
  { rows: PLAIN, shown: 4, label: 'as selected', note: 'addi a0 does not depend on the multiply at all, yet it waited behind it. It starts in cycle 7.' },
  { rows: PLAIN, shown: 5, label: 'as selected', note: 'The branch starts in cycle 8, so one trip round the loop takes 9 cycles, 4 of them stalls.' },
  { rows: CLANG, shown: 1, label: 'as clang ordered it', note: 'Now the order clang -O2 really produced for this loop. Same five instructions, same meaning; ld starts in cycle 0 as before.' },
  { rows: CLANG, shown: 2, label: 'as clang ordered it', note: 'mul still has to wait for the load: cycles 1 and 2 are stalls. Nothing else is ready to fill them yet.' },
  { rows: CLANG, shown: 3, label: 'as clang ordered it', note: 'Here is the move: addi a0 has been placed straight after mul, so it fills cycle 4, a cycle that was wasted before.' },
  { rows: CLANG, shown: 4, label: 'as clang ordered it', note: 'add starts in cycle 6, the first cycle the product exists; only cycle 5 is a stall now.' },
  { rows: CLANG, shown: 5, label: 'as clang ordered it', note: 'The branch starts in cycle 7: 8 cycles a trip instead of 9, with no change to what the loop computes. That is instruction scheduling.' },
];

const CW = 28;
const X0 = 136;
const COLS = 9;

export default function StallSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const issued = st.rows.slice(0, st.shown);
  return (
    <StepFrame title="Stalls in one trip round the loop" steps={s} note={st.note}>
      <Svg w={400} h={210} title="A grid with the five loop instructions as rows and cycles 0 to 8 as columns; each instruction's start cycle is filled in, and idle cycles before it are shaded as stalls.">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>ORDER: {st.label.toUpperCase()}</T>
        {Array.from({ length: COLS }, (_, c) => (
          <T key={c} x={X0 + c * CW + CW / 2} y={30} size={11} mono anchor="middle" fill={tok('muted')}>{c}</T>
        ))}
        {st.rows.map((r, k) => {
          const y = 40 + k * 30;
          const prev = k === 0 ? -1 : st.rows[k - 1].at;
          const on = k < st.shown;
          return (
            <g key={k} opacity={on ? 1 : 0.35}>
              <T x={8} y={y + 12} size={11} mono>{r.text}</T>
              {Array.from({ length: COLS }, (_, c) => {
                const stall = on && c > prev && c < r.at;
                const issue = on && c === r.at;
                return (
                  <Box key={c} x={X0 + c * CW + 2} y={y} w={CW - 4} h={24} r={3}
                    fill={issue ? tok('brand', 0.85) : stall ? tok('warn', 0.3) : 'transparent'}
                    stroke={issue ? tok('brand') : stall ? tok('warn') : tok('line', 0.5)} />
                );
              })}
            </g>
          );
        })}
        <Box x={8} y={194} w={12} h={10} r={2} fill={tok('brand', 0.85)} stroke={tok('brand')} />
        <T x={26} y={199} size={11}>starts</T>
        <Box x={80} y={194} w={12} h={10} r={2} fill={tok('warn', 0.3)} stroke={tok('warn')} />
        <T x={98} y={199} size={11}>stall (waiting)</T>
        {st.shown === 5 && (
          <T x={392} y={199} size={12} weight={700} anchor="end" fill={tok('brand')}>
            {st.rows[4].at + 1} cycles a trip
          </T>
        )}
      </Svg>
    </StepFrame>
  );
}
