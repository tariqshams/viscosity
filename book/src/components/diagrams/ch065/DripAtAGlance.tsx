import { Box, Svg, T, tok } from '../../viz/svg';

const ROWS: [string, string][] = [
  ['function f(x) {…}', 'fn f(x) {…}'],
  ['let x = 1;', 'let x = 1;'],
  ['console.log(x);', 'print x;'],
  ['a && b   a || b', 'a and b   a or b'],
  ['null', 'nil'],
  ['x += 1;   i++;', 'x = x + 1;'],
  ['new Cup(3)', 'Cup(3)'],
  ['constructor(ml) {…}', 'init(ml) {…}'],
  ['class B extends A', 'class B < A'],
  ['[1, 2, 3]', '(no arrays)'],
];

/** The same ideas spelled in JavaScript and in Drip. */
export default function DripAtAGlance() {
  return (
    <Svg w={400} h={262} title="A two-column table: JavaScript spellings on the left, the Drip spelling of the same idea on the right.">
      <T x={10} y={14} size={12} weight={700} fill={tok('muted')}>JAVASCRIPT</T>
      <T x={210} y={14} size={12} weight={700} fill={tok('brand')}>DRIP</T>
      {ROWS.map(([js, drip], k) => {
        const y = 28 + k * 23;
        const same = js === drip;
        const missing = drip.startsWith('(');
        return (
          <g key={k}>
            <Box x={4} y={y} w={192} h={20} r={3} fill={tok('panel')} stroke={tok('line')}>
              <T x={12} y={y + 10} size={12} mono>{js}</T>
            </Box>
            <Box x={204} y={y} w={192} h={20} r={3} fill={same ? tok('panel') : missing ? tok('danger', 0.08) : tok('brand', 0.1)} stroke={same ? tok('line') : missing ? tok('danger') : tok('brand')}>
              <T x={212} y={y + 10} size={12} mono fill={missing ? tok('danger') : undefined}>{drip}</T>
            </Box>
          </g>
        );
      })}
      <T x={200} y={256} size={11} anchor="middle" fill={tok('muted')}>blue: spelled differently in Drip · grey: the same</T>
    </Svg>
  );
}
