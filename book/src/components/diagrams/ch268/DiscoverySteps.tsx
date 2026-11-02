import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// Collection discovery (core/src/analysis.ts, sections 1 and 2) on the
// real VIR of
//   const ps = [];
//   ps.push({ x: 1, y: 2 });
//   ps.push({ x: 3, y: 4 });
//   console.log(ps.length);
// The worklist pops loads from the end, so the last load is seen first.
// The final step uses the real result for { y: 3, x: 4 } on line 3.
const VIR = [
  '%0 = array.empty',
  'store ps, %0',
  '%2 = load ps',
  '%5 = record {x, y} %3, %4',
  '%6 = push %2, %5',
  '%7 = load ps',
  '%10 = record {x, y} %8, %9',
  '%11 = push %7, %10',
  '%14 = load ps',
  '%15 = field.get %14 .length',
];
const SWAPPED = '%10 = record {y, x} %8, %9';

type S = { hi: number[]; work: string; fields: string; bad: boolean; swapped: boolean; note: string };
const STATES: S[] = [
  { hi: [1, 2, 5, 8], work: '', fields: '', bad: false, swapped: false, note: 'Pass 1 scans every instruction once and files each store and load under its binding. ps has one store and three loads (%2, %7, %14). The constants (%3, %4, …) are left out here.' },
  { hi: [0, 1], work: '', fields: '', bad: false, swapped: false, note: 'ps is a const, and one of its stores stores an array.empty: it is a candidate collection. It has exactly one store, so there is no reassignment bailout.' },
  { hi: [8, 9], work: '%2 %7 %14', fields: '', bad: false, swapped: false, note: 'Pass 2 puts the loads on a worklist and pops from the end, so %14 comes first. Its only use is field.get .length: allowed, recorded as a length read.' },
  { hi: [5, 6, 7], work: '%2 %7', fields: '{x, y}', bad: false, swapped: false, note: 'Next %7: used by a push with one argument, %10, a fresh record.new. This is the first record seen, so it sets the shape to {x, y}. %10 has no other use, so it can’t be aliased.' },
  { hi: [2, 3, 4], work: '%2', fields: '{x, y}', bad: false, swapped: false, note: 'Last %2: another push of a fresh record, with the same fields in the same order. The worklist is empty and nothing was rejected: ps is a collection of {x, y} records.' },
  { hi: [6], work: '', fields: '{y, x}', bad: true, swapped: true, note: 'Now swap line 3 to { y: 3, x: 4 }. %7 is still seen first, so the shape becomes {y, x}, and %2’s {x, y} no longer matches. The real explain output: line 2: records with different fields or field order ({x, y} vs {y, x}).' },
];

export default function DiscoverySteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Collection discovery scans stores and pushes" steps={s} note={st.note}>
      <Svg w={400} h={250} title="VIR for a program that pushes two records into ps, with the instructions the analysis is looking at highlighted">
        {VIR.map((l, k) => {
          const on = st.hi.includes(k);
          const bad = st.bad && on;
          const txt = k === 6 && st.swapped ? SWAPPED : l;
          return (
            <g key={k}>
              {on && <rect x={8} y={6 + k * 19} width={240} height={17} rx={3} fill={bad ? tok('danger', 0.2) : tok('brand', 0.15)} />}
              <T x={14} y={15 + k * 19} size={11} mono>{txt}</T>
            </g>
          );
        })}
        <Box x={262} y={8} w={130} h={56} stroke={tok('ink', 0.4)}>
          <T x={272} y={24} size={11} weight={700} fill={tok('muted')}>WORKLIST</T>
          <T x={272} y={46} size={12} mono>{st.work || 'empty'}</T>
        </Box>
        <Box x={262} y={76} w={130} h={56} stroke={st.bad ? tok('danger') : tok('ink', 0.4)}>
          <T x={272} y={92} size={11} weight={700} fill={tok('muted')}>SHAPE OF ps</T>
          <T x={272} y={114} size={12} mono fill={st.bad ? tok('danger') : undefined}>{st.fields || '(none yet)'}</T>
        </Box>
        <Box x={262} y={144} w={130} h={56} stroke={tok('ink', 0.4)}>
          <T x={272} y={160} size={11} weight={700} fill={tok('muted')}>VERDICT</T>
          <T x={272} y={182} size={12} weight={700} fill={st.bad ? tok('danger') : st.hi.length === 3 && st.work === '%2' ? tok('safe') : tok('muted')}>
            {st.bad ? 'bailout' : st.work === '%2' ? 'collection' : '…'}
          </T>
        </Box>
        <T x={14} y={208} size={11} fill={tok('muted')}>source</T>
        <T x={14} y={224} size={11} mono fill={tok('muted')}>{"ps.push({ x: 1, y: 2 });"}</T>
        <T x={14} y={240} size={11} mono fill={st.swapped ? tok('danger') : tok('muted')}>{st.swapped ? 'ps.push({ y: 3, x: 4 });' : 'ps.push({ x: 3, y: 4 });'}</T>
      </Svg>
    </StepFrame>
  );
}
