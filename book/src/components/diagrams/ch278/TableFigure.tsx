import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 278: zero-cost exceptions. The function's normal code runs
// straight through; a separate table, read only when something is thrown,
// maps the range around the call to the landing pad. The rows are the ones
// clang 18 wrote for load (see the chapter), with the labels shortened.
const CODE: [string, string, boolean][] = [
  ['tmp0', 'call parse', true],
  ['tmp1', 'addiw s0, a0, 1', false],
  ['', 'call ~File', false],
  ['', 'ret', false],
  ['tmp2', 'call ~File', false],
  ['', 'call _Unwind_Resume', false],
];

export default function TableFigure() {
  return (
    <Svg w={400} h={232} title="The code of load on the left, running straight through, and its exception table on the right, which points from the range around the call to the landing pad">
      <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>THE CODE OF load</T>
      <T x={240} y={12} size={11} weight={700} fill={tok('muted')}>ITS TABLE (.gcc_except_table)</T>
      {CODE.map(([label, ins, covered], k) => {
        const y = 24 + k * 30;
        const pad = k >= 4;
        return (
          <g key={k}>
            <Box x={8} y={y} w={204} h={26} fill={covered ? tok('brand', 0.15) : pad ? tok('safe', 0.15) : tok('panel')} stroke={covered ? tok('brand') : pad ? tok('safe') : tok('line')}>
              <T x={14} y={y + 13} size={11} mono fill={tok('muted')}>{label}</T>
              <T x={54} y={y + 13} size={12} mono>{ins}</T>
            </Box>
          </g>
        );
      })}
      <T x={110} y={210} size={11} anchor="middle" fill={tok('muted')}>normal path: top to ret, no extra work</T>
      <T x={110} y={224} size={11} anchor="middle" fill={tok('safe')}>landing pad: only after a throw</T>
      <Box x={240} y={26} w={152} h={58} stroke={tok('brand')}>
        <T x={248} y={42} size={11} mono>tmp0 … tmp1</T>
        <T x={248} y={58} size={11} mono>→ pad tmp2</T>
        <T x={248} y={74} size={11} mono>action: cleanup</T>
      </Box>
      <Box x={240} y={92} w={152} h={42}>
        <T x={248} y={107} size={11} mono>tmp1 … end</T>
        <T x={248} y={122} size={11} mono>→ no landing pad</T>
      </Box>
      <Arrow x1={212} y1={37} x2={238} y2={50} color={tok('brand')} />
      <Arrow x1={300} y1={84} x2={214} y2={150} color={tok('safe')} bend={-0.3} />
      <T x={316} y={160} size={11} anchor="middle" fill={tok('muted')}>read by the unwinder</T>
      <T x={316} y={174} size={11} anchor="middle" fill={tok('muted')}>only when parse throws</T>
    </Svg>
  );
}
