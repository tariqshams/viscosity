import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 275: which call in each return statement is a tail call.
const ROWS: { pre: string; call: string; post: string; tail: boolean; why: string }[] = [
  { pre: 'return ', call: 'f(x)', post: ';', tail: true, why: 'its result is the answer' },
  { pre: 'return 1 + ', call: 'f(x)', post: ';', tail: false, why: 'the + is still to do' },
  { pre: 'return c ? ', call: 'f(x)', post: ' : g(x);', tail: true, why: 'either branch is the answer' },
  { pre: 'return ', call: 'f(x)', post: ' || g(x);', tail: false, why: 'its value must be tested' },
  { pre: '', call: 'f(x)', post: '; return;', tail: false, why: 'its result is thrown away' },
];

export default function TailFigure() {
  return (
    <Svg w={400} h={196} title="Five return statements; the highlighted call is a tail call in the first and third only">
      <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>IS THE MARKED CALL A TAIL CALL?</T>
      {ROWS.map((r, k) => {
        const y = 28 + k * 34;
        const w1 = r.pre.length * 7.2;
        return (
          <g key={k}>
            <T x={8} y={y + 10} size={12} mono>{r.pre}</T>
            <Box x={8 + w1 - 2} y={y} w={r.call.length * 7.2 + 4} h={20} r={3} fill={r.tail ? tok('f3', 0.2) : tok('f6', 0.15)} stroke={r.tail ? tok('f3') : tok('f6')}>
              <T x={8 + w1} y={y + 10} size={12} mono>{r.call}</T>
            </Box>
            <T x={8 + w1 + r.call.length * 7.2 + 2} y={y + 10} size={12} mono>{r.post}</T>
            <T x={250} y={y + 4} size={12} weight={700} fill={r.tail ? tok('f3') : tok('f6')}>{r.tail ? 'yes' : 'no'}</T>
            <T x={250} y={y + 18} size={11} fill={tok('muted')}>{r.why}</T>
          </g>
        );
      })}
    </Svg>
  );
}
