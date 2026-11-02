// Chapter 245: a superoptimiser looking for sgn(x). Candidates, shortest
// first, are run on a few test inputs; only one that matches every test is
// worth the cost of a proof.
import { Box, Svg, T, tok } from '../../viz/svg';

type Row = { len: number; code: string; out: string; ok: boolean };
const ROWS: Row[] = [
  { len: 1, code: 'neg  a0, a0', out: '5, 0, -7', ok: false },
  { len: 1, code: 'snez a0, a0', out: '1, 0, 1', ok: false },
  { len: 1, code: 'srai a0, a0, 63', out: '-1, 0, 0', ok: false },
  { len: 2, code: 'srai a1, a0, 63 · snez a0, a0', out: '1, 0, 1', ok: false },
  { len: 3, code: 'srai · snez · or a0, a1, a0', out: '-1, 0, 1', ok: true },
];

export default function SearchFigure() {
  return (
    <Svg w={400} h={250} title="The target, sgn of x, gives -1, 0 and 1 for the test inputs -5, 0 and 7. Candidate sequences of length 1 and 2 give the wrong outputs; the three-instruction sequence srai, snez, or gives -1, 0, 1 and passes, so it goes on to be proved.">
      <Box x={4} y={4} w={392} h={34} fill={tok('brand', 0.1)} stroke={tok('brand')}>
        <T x={14} y={21} size={12} weight={700}>target sgn(x) on tests x = -5, 0, 7</T>
        <T x={386} y={21} size={12} mono anchor="end" weight={700}>-1, 0, 1</T>
      </Box>
      <T x={8} y={54} size={11} weight={700} fill={tok('muted')}>LEN  CANDIDATE</T>
      <T x={392} y={54} size={11} weight={700} anchor="end" fill={tok('muted')}>OUTPUTS</T>
      {ROWS.map((r, k) => {
        const y = 64 + k * 30;
        return (
          <Box key={k} x={4} y={y} w={392} h={26} fill={r.ok ? tok('safe', 0.14) : tok('panel')} stroke={r.ok ? tok('safe') : tok('line')}>
            <T x={14} y={y + 13} size={11} mono>{r.len}</T>
            <T x={40} y={y + 13} size={11} mono>{r.code}</T>
            <T x={352} y={y + 13} size={11} mono anchor="end">{r.out}</T>
            <T x={386} y={y + 13} size={13} anchor="end" weight={700} fill={r.ok ? tok('safe') : tok('danger')}>{r.ok ? '✓' : '✗'}</T>
          </Box>
        );
      })}
      <T x={8} y={222} size={11} fill={tok('muted')}>Passing the tests is only a filter: the survivor</T>
      <T x={8} y={238} size={11} fill={tok('muted')}>must then be proved equal for every x.</T>
    </Svg>
  );
}
