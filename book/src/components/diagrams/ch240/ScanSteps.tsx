// Chapter 240: Poletto and Sarkar's linear scan on sumsq with three
// registers. Intervals are visited by start point; the active list is kept
// in order of end point.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const IV = [
  { v: 'n', start: 1, end: 8 },
  { v: 's', start: 2, end: 9 },
  { v: 'i', start: 3, end: 8 },
  { v: 't', start: 5, end: 6 },
];
const X0 = 70; const U = 30;

type S = { at: number | null; regs: Record<string, string>; active: string[]; note: string };
const STATES: S[] = [
  { at: null, regs: {}, active: [], note: 'Three registers, a1 to a3, and four intervals sorted by where they start. We walk through them in that order, once, keeping the list of active intervals (those holding a register) sorted by where they end.' },
  { at: 0, regs: { n: 'a1' }, active: ['n'], note: 'n starts at 1. Nothing has ended yet, and a1 is free: n gets a1. Active: n (ends at 8).' },
  { at: 1, regs: { n: 'a1', s: 'a2' }, active: ['n', 's'], note: 's starts at 2: a2. Active, by end: n (8), s (9).' },
  { at: 2, regs: { n: 'a1', s: 'a2', i: 'a3' }, active: ['n', 'i', 's'], note: 'i starts at 3: a3, the last free register. Active, by end: n (8), i (8), s (9).' },
  { at: 3, regs: { n: 'a1', s: 'a2', i: 'a3' }, active: ['n', 'i', 's'], note: 't starts at 5. First, expire: has any active interval ended before 5? No. No register is free, so someone must be spilled: compare t (ends at 6) with the active interval that ends last, s (ends at 9).' },
  { at: 3, regs: { n: 'a1', s: 'spill', i: 'a3', t: 'a2' }, active: ['t', 'n', 'i'], note: 's ends later, so s is spilled and t takes its register, a2. This is the rule of linear scan: free the register that would otherwise stay busy longest.' },
  { at: null, regs: { n: 'a1', s: 'spill', i: 'a3', t: 'a2' }, active: [], note: 'Done, in one pass. Note the choice: colouring spilled n, which costs one load per trip; linear scan, which never counts loads, spilled s, which costs a load and a store per trip. Speed of allocation, paid for in code quality.' },
];

export default function ScanSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Linear scan, one pass over the intervals" steps={s} note={st.note}>
      <Svg w={400} h={210} title="Four live intervals as bars, with the register or spill decided for each, and the active list.">
        {Array.from({ length: 10 }, (_, k) => (
          <T key={k} x={X0 + k * U + 15} y={12} size={11} mono anchor="middle" fill={tok('muted')}>{k + 1}</T>
        ))}
        {IV.map((iv, j) => {
          const r = st.regs[iv.v];
          const hot = st.at === j;
          const spilt = r === 'spill';
          return (
            <g key={iv.v}>
              <T x={8} y={42 + j * 32} size={13} mono weight={700}>{iv.v}</T>
              <Box x={X0 + (iv.start - 1) * U + 2} y={30 + j * 32} w={(iv.end - iv.start + 1) * U - 4} h={22} fill={spilt ? tok('danger', 0.15) : r ? tok('safe', 0.2) : tok('panel')} stroke={hot ? tok('warn') : spilt ? tok('danger') : r ? tok('safe') : tok('line')} dash={spilt} />
              {r && <T x={X0 + (iv.start - 1) * U + 10} y={42 + j * 32} size={12} mono weight={700} fill={spilt ? tok('danger') : undefined}>{r}</T>}
            </g>
          );
        })}
        <T x={8} y={176} size={11} weight={700} fill={tok('muted')}>ACTIVE, BY END POINT</T>
        <T x={8} y={196} size={12.5} mono>{st.active.map((v) => `${v} (${IV.find((x) => x.v === v)!.end})`).join('  ') || '(none)'}</T>
      </Svg>
    </StepFrame>
  );
}
