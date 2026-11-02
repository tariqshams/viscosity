import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// A vectorized sum of ten numbers with four lanes: two full chunks of four,
// then a tail of two, then the "horizontal" step that adds the lanes.
const XS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const W = 4;

type S = { upto: number; lanes: number[]; total: number | null; note: string };

const STATES: S[] = [
  { upto: 0, lanes: [0, 0, 0, 0], total: null, note: 'We want the sum of ten numbers. A four-lane register starts with a zero in every lane: four separate running totals, one per lane.' },
  { upto: 4, lanes: [1, 2, 3, 4], total: null, note: 'One vector add takes the first chunk, elements 0 to 3, and adds element 0 into lane 0, element 1 into lane 1, and so on. Four additions, one instruction.' },
  { upto: 8, lanes: [6, 8, 10, 12], total: null, note: 'The second chunk, elements 4 to 7, goes the same way: lane 0 now holds 1 + 5, lane 1 holds 2 + 6. Each lane only ever sees every fourth element.' },
  { upto: 10, lanes: [15, 18, 10, 12], total: null, note: 'Two elements are left over: the tail, too few to fill a register. They are added one at a time, element 8 into lane 0 and element 9 into lane 1.' },
  { upto: 10, lanes: [15, 18, 10, 12], total: 55, note: 'Last, the lanes are added to each other: 15 + 18 + 10 + 12 = 55, the same answer as a plain loop. But the additions happened in a different order, which matters for floats.' },
];

const CW = 34;
const X0 = 30;

export default function LaneSumSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Summing in four lanes" steps={s} note={st.note}>
      <Svg w={400} h={210} title="Ten numbers in a row, coloured by the lane they go into, above a four-lane register of running totals">
        <T x={X0} y={12} size={11} weight={700} fill={tok('muted')}>THE ARRAY (colour = lane i % 4)</T>
        {XS.map((v, i) => {
          const done = i < st.upto;
          const lane = i % W;
          return (
            <g key={i}>
              <Box x={X0 + i * CW} y={24} w={CW - 4} h={30} r={4} fill={tok(`f${lane + 1}`, done ? 0.35 : 0.1)} stroke={tok('ink', 0.35)}>
                <T x={X0 + i * CW + (CW - 4) / 2} y={39} size={14} mono anchor="middle" opacity={done ? 1 : 0.5}>{v}</T>
              </Box>
              <T x={X0 + i * CW + (CW - 4) / 2} y={64} size={11} mono anchor="middle" fill={tok('muted')}>{i}</T>
            </g>
          );
        })}
        <T x={X0} y={92} size={11} weight={700} fill={tok('muted')}>THE REGISTER: ONE RUNNING TOTAL PER LANE</T>
        <Box x={X0 - 4} y={104} w={4 * 70 + 8} h={40} r={7} fill={tok('brand', 0.08)} stroke={tok('brand')}>
          {st.lanes.map((v, k) => (
            <g key={k}>
              <rect x={X0 + 2 + k * 70} y={110} width={62} height={28} rx={4} fill={tok(`f${k + 1}`, 0.3)} />
              <T x={X0 + 33 + k * 70} y={124} size={15} mono anchor="middle" weight={700}>{v}</T>
            </g>
          ))}
        </Box>
        {[0, 1, 2, 3].map((k) => (
          <T key={k} x={X0 + 33 + k * 70} y={156} size={11} mono anchor="middle" fill={tok('muted')}>lane {k}</T>
        ))}
        <T x={X0} y={190} size={14} mono weight={700} fill={st.total === null ? tok('muted') : tok('safe')}>
          {st.total === null ? 'total: not yet' : `total = ${st.lanes.join(' + ')} = ${st.total}`}
        </T>
      </Svg>
    </StepFrame>
  );
}
