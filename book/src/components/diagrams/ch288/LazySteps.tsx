import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 288: a lazy iterator chain pulls one element at a time through
// every stage. The printed lines are the real output of the chapter's
// lazy-trace example (rustc 1.97). The JavaScript row shows what
// Array.prototype.filter and map build instead: a new array per stage.
const CODE = `let it = xs.iter()
    .filter(|x| *x % 2 == 0)
    .map(|x| x * 10);
let total: i32 = it.sum();`;

type S = {
  line: number;
  at: number | null; // which element of xs is moving
  stage: 'none' | 'filter' | 'map' | 'sum' | 'rejected' | 'done';
  sum: number | null;
  log: string[];
  js?: boolean;
  note: string;
};

const XS = [1, 2, 3, 4];

const STATES: S[] = [
  { line: 0, at: null, stage: 'none', sum: null, log: [], note: 'Building the chain runs nothing. it is just a Map wrapped around a Filter wrapped around a slice iterator: three small structs, no elements touched.' },
  { line: 3, at: 0, stage: 'rejected', sum: 0, log: ['filter 1'], note: 'sum asks map for an item; map asks filter; filter asks the slice iterator, which hands over 1. Odd, so filter drops it and asks again.' },
  { line: 3, at: 1, stage: 'filter', sum: 0, log: ['filter 1', 'filter 2'], note: 'The iterator hands over 2. It is even, so filter passes it up to map.' },
  { line: 3, at: 1, stage: 'sum', sum: 20, log: ['filter 1', 'filter 2', '  map 2'], note: 'map turns 2 into 20 and returns it to sum. Element 2 has gone all the way through before anyone looks at 3.' },
  { line: 3, at: 2, stage: 'rejected', sum: 20, log: ['filter 1', 'filter 2', '  map 2', 'filter 3'], note: '3 is odd: dropped inside filter. map never sees it.' },
  { line: 3, at: 3, stage: 'sum', sum: 60, log: ['filter 1', 'filter 2', '  map 2', 'filter 3', 'filter 4', '  map 4'], note: '4 passes, becomes 40, and sum reaches 60.' },
  { line: 3, at: null, stage: 'done', sum: 60, log: ['filter 1', 'filter 2', '  map 2', 'filter 3', 'filter 4', '  map 4'], note: 'The slice iterator returns None, every stage passes the None up, and sum returns 60. At no point was a list of the even numbers stored anywhere.' },
  { line: 3, at: null, stage: 'done', sum: 60, log: [], js: true, note: 'JavaScript’s xs.filter(...).map(...) runs stage by stage instead: filter visits all four and builds [2, 4], then map builds [20, 40], then reduce adds them. Two new arrays for one sum.' },
];

const STAGES = ['filter', 'map', 'sum'] as const;

export default function LazySteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="One element at a time" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={200} title="Elements of xs pulled one at a time through filter, map and sum">
        <T x={8} y={14} size={11} weight={700} fill={tok('muted')}>xs</T>
        {XS.map((v, k) => {
          const on = st.at === k;
          const used = st.at !== null ? k < st.at : st.stage === 'done';
          return (
            <Box key={k} x={8 + k * 34} y={24} w={30} h={26} r={3} fill={on ? tok('brand', 0.25) : tok('panel')} stroke={on ? tok('brand') : tok('line')} opacity={used && !on ? 0.6 : 1}>
              <T x={23 + k * 34} y={37} size={12} mono anchor="middle">{v}</T>
            </Box>
          );
        })}
        {!st.js && STAGES.map((g, k) => {
          const x = 160 + k * 80;
          const lit = st.stage === g || (st.stage === 'sum' && g !== 'sum') || (st.stage === 'rejected' && g === 'filter');
          const col = st.stage === 'rejected' && g === 'filter' ? tok('danger') : tok('accent');
          return (
            <g key={g}>
              <Box x={x} y={24} w={66} h={26} r={3} fill={lit ? tok('accent', 0.15) : tok('panel')} stroke={lit ? col : tok('line')}>
                <T x={x + 33} y={37} size={11} mono anchor="middle">{g === 'sum' ? `sum ${st.sum ?? ''}` : g}</T>
              </Box>
              {k > 0 && <Arrow x1={x - 13} y1={37} x2={x - 2} y2={37} color={tok('ink', 0.5)} width={1.5} />}
            </g>
          );
        })}
        {!st.js && <Arrow x1={144} y1={37} x2={158} y2={37} color={tok('ink', 0.5)} width={1.5} />}
        {!st.js && (
          <g>
            <T x={8} y={72} size={11} weight={700} fill={tok('muted')}>printed so far</T>
            {st.log.map((l, k) => (
              <T key={k} x={14 + Math.floor(k / 4) * 120} y={92 + (k % 4) * 18} size={11} mono>{l}</T>
            ))}
          </g>
        )}
        {st.js && (
          <g>
            <T x={160} y={14} size={11} weight={700} fill={tok('muted')}>JavaScript arrays</T>
            {[['filter →', '[2, 4]'], ['map →', '[20, 40]'], ['reduce →', '60']].map(([a, b], k) => (
              <g key={a}>
                <T x={160} y={37 + k * 32} size={11} mono>{a}</T>
                <Box x={236} y={24 + k * 32} w={90} h={26} r={3} fill={k < 2 ? tok('warn', 0.15) : tok('panel')} stroke={k < 2 ? tok('warn') : tok('line')}>
                  <T x={281} y={37 + k * 32} size={11} mono anchor="middle">{b}</T>
                </Box>
              </g>
            ))}
            <T x={160} y={140} size={11} fill={tok('muted')}>two arrays allocated, then thrown away</T>
          </g>
        )}
      </Svg>
    </StepFrame>
  );
}
