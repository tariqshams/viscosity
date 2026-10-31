import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const CODE = `const xs = [1, 4, 9];
const big = xs.filter((n) => n > 3);
const tens = big.map((n) => n * 10);
const sum = tens.reduce(
  (t, n) => t + n, 0);`;

type S = {
  line: number;
  label: string;
  inp: number[];
  cur: number | null;
  call?: string;
  result?: string;
  good?: boolean;
  outLabel: string;
  out: number[];
  acc?: number;
  note: string;
};

const STATES: S[] = [
  { line: 0, label: 'xs', inp: [1, 4, 9], cur: null, outLabel: '', out: [], note: 'An ordinary array of three numbers. Watch it: none of the three methods below will change it.' },
  { line: 1, label: 'xs', inp: [1, 4, 9], cur: 0, call: 'n > 3 with n = 1', result: 'false', good: false, outLabel: 'big', out: [], note: 'filter calls your callback once per item. For 1 it returns false, so 1 is left out of the new array.' },
  { line: 1, label: 'xs', inp: [1, 4, 9], cur: 1, call: 'n > 3 with n = 4', result: 'true', good: true, outLabel: 'big', out: [4], note: 'For 4 the callback returns true, so filter copies 4 into the new array.' },
  { line: 1, label: 'xs', inp: [1, 4, 9], cur: 2, call: 'n > 3 with n = 9', result: 'true', good: true, outLabel: 'big', out: [4, 9], note: '9 passes too. filter is done: big is a NEW array, [4, 9]. It can be shorter than the original.' },
  { line: 2, label: 'big', inp: [4, 9], cur: 0, call: 'n * 10 with n = 4', result: '40', good: true, outLabel: 'tens', out: [40], note: 'map also calls the callback once per item, but keeps whatever it returns: 4 becomes 40.' },
  { line: 2, label: 'big', inp: [4, 9], cur: 1, call: 'n * 10 with n = 9', result: '90', good: true, outLabel: 'tens', out: [40, 90], note: '9 becomes 90. map always gives back a new array of the SAME length: one result per item.' },
  { line: 3, label: 'tens', inp: [40, 90], cur: null, outLabel: 't', out: [], acc: 0, note: 'reduce keeps one running value, t. It starts as the initial value you passed at the end: 0.' },
  { line: 4, label: 'tens', inp: [40, 90], cur: 0, call: 't + n with t = 0, n = 40', result: '40', good: true, outLabel: 't', out: [], acc: 40, note: 'For each item, the callback gets the running value and the item. Whatever it returns becomes the new t: 0 + 40 = 40.' },
  { line: 4, label: 'tens', inp: [40, 90], cur: 1, call: 't + n with t = 40, n = 90', result: '130', good: true, outLabel: 't', out: [], acc: 130, note: '40 + 90 = 130. There are no items left, so reduce returns the final t: sum is 130.' },
];

export default function PipelineSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const cell = 56;
  return (
    <StepFrame title="filter, map and reduce, one call at a time" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={190} title="The input array on top, the callback call in the middle, and the output underneath">
        <T x={10} y={14} size={11} weight={700} fill={tok('muted')}>INPUT: {st.label}</T>
        {st.inp.map((v, k) => (
          <Box key={k} x={10 + k * (cell + 6)} y={24} w={cell} h={34} fill={k === st.cur ? tok('brand', 0.18) : tok('panel')} stroke={k === st.cur ? tok('brand') : tok('ink', 0.45)}>
            <T x={10 + k * (cell + 6) + cell / 2} y={41.5} size={16} mono anchor="middle">{v}</T>
          </Box>
        ))}
        {st.call && (
          <>
            <Arrow x1={10 + (st.cur ?? 0) * (cell + 6) + cell / 2} y1={60} x2={10 + (st.cur ?? 0) * (cell + 6) + cell / 2} y2={80} color={tok('brand')} />
            <T x={10} y={96} size={13} mono>callback: {st.call}</T>
            <T x={10} y={118} size={13} mono weight={700} fill={st.good ? tok('safe') : tok('danger')}>returns {st.result}</T>
          </>
        )}
        {st.outLabel && <T x={10} y={142} size={11} weight={700} fill={tok('muted')}>{st.acc === undefined ? `NEW ARRAY: ${st.outLabel}` : 'RUNNING VALUE: t'}</T>}
        {st.acc === undefined
          ? st.out.map((v, k) => (
              <Box key={k} x={10 + k * (cell + 6)} y={152} w={cell} h={34} fill={tok('safe', 0.12)} stroke={tok('safe')}>
                <T x={10 + k * (cell + 6) + cell / 2} y={169.5} size={16} mono anchor="middle">{v}</T>
              </Box>
            ))
          : (
            <Box x={10} y={152} w={cell + 20} h={34} fill={tok('accent', 0.12)} stroke={tok('accent')}>
              <T x={10 + (cell + 20) / 2} y={169.5} size={16} mono anchor="middle">{st.acc}</T>
            </Box>
          )}
        {st.outLabel && st.acc === undefined && st.out.length === 0 && (
          <Box x={10} y={152} w={cell} h={34} dash fill="transparent" stroke={tok('line')}>
            <T x={10 + cell / 2} y={169.5} size={12} anchor="middle" fill={tok('muted')}>empty</T>
          </Box>
        )}
      </Svg>
    </StepFrame>
  );
}
