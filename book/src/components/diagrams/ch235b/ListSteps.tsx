// Chapter 235-b (staged split of 235): list scheduling of two trips of the
// sum-of-squares loop, cycle by cycle, on the toy machine (one instruction
// per cycle; ld and mul take 3 cycles, add 1). Priority is the height.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const INS = [
  { text: 'ld  a3, 0(a0)', h: 7 },
  { text: 'mul a3, a3, a3', h: 4 },
  { text: 'add a2, a3, a2', h: 1 },
  { text: 'ld  a4, 8(a0)', h: 6 },
  { text: 'mul a4, a4, a4', h: 3 },
  { text: 'add a2, a4, a2', h: 0 },
];
// Start cycle of each instruction in the final schedule.
const START = [0, 3, 6, 1, 4, 7];
// Cycle at which each becomes ready, given the starts above.
const READY = [0, 3, 6, 0, 4, 7];

type S = { c: number; note: string };
const STATES: S[] = [
  { c: -1, note: 'Two trips of the loop, renamed so they use a3 and a4. Each instruction is labelled with its height h: the longest chain of delays from it to the end of the block. Higher means more urgent.' },
  { c: 0, note: 'Cycle 0: both loads are ready (nothing comes before them). The first ld has height 7, the second 6, so the first one starts.' },
  { c: 1, note: 'Cycle 1: the only ready instruction is the second ld (the first mul must wait until cycle 3), so it starts now, hiding inside the first load\'s wait.' },
  { c: 2, note: 'Cycle 2: nothing is ready: the first mul needs cycle 3, the second needs cycle 4. A stall that no order could avoid.' },
  { c: 3, note: 'Cycle 3: the first load\'s value has arrived, so its mul starts.' },
  { c: 4, note: 'Cycle 4: the second mul is ready one cycle later and starts at once.' },
  { c: 5, note: 'Cycle 5: the first add needs the first product, ready in cycle 6. Another stall.' },
  { c: 6, note: 'Cycle 6: the first add starts.' },
  { c: 7, note: 'Cycle 7: the last add needs both the second product (ready at 7) and the new sum (ready at 7). It starts, and the block is done in 8 cycles, against 14 in the original order.' },
];

export default function ListSteps() {
  const s = useSteps(STATES);
  const c = s.state.c;
  return (
    <StepFrame title="List scheduling, one cycle at a time" steps={s} note={s.state.note}>
      <Svg w={400} h={208} title="Six instructions with their heights; each is marked as started (with its cycle), ready, or waiting, for the current cycle.">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>INSTRUCTION</T>
        <T x={196} y={12} size={11} weight={700} fill={tok('muted')} anchor="middle">h</T>
        <T x={232} y={12} size={11} weight={700} fill={tok('muted')}>{c < 0 ? 'STATUS' : `STATUS AT CYCLE ${c}`}</T>
        {INS.map((ins, k) => {
          const y = 24 + k * 30;
          const started = c >= 0 && START[k] < c;
          const now = c >= 0 && START[k] === c;
          const ready = c >= 0 && !started && !now && READY[k] <= c;
          const status = c < 0 ? '' : now ? `starts now` : started ? `started in ${START[k]}` : ready ? 'ready' : `waits (ready at ${READY[k]})`;
          const fill = now ? tok('brand', 0.18) : started ? tok('safe', 0.1) : tok('panel');
          const stroke = now ? tok('brand') : started ? tok('safe') : tok('line');
          return (
            <g key={k}>
              <Box x={4} y={y} w={392} h={24} fill={fill} stroke={stroke}>
                <T x={12} y={y + 12} size={12} mono>{ins.text}</T>
                <T x={196} y={y + 12} size={12} mono anchor="middle" weight={700}>{ins.h}</T>
                <T x={232} y={y + 12} size={12} fill={now ? tok('brand') : tok('ink')} weight={now ? 700 : undefined}>{status}</T>
              </Box>
            </g>
          );
        })}
        {c >= 0 && (
          <T x={8} y={202} size={12} weight={700} fill={START.includes(c) ? tok('brand') : tok('warn')}>
            {START.includes(c) ? `cycle ${c}: one instruction starts` : `cycle ${c}: stall`}
          </T>
        )}
      </Svg>
    </StepFrame>
  );
}
