import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 284: the count updates of Rc::clone and drop in
// fn peek(r: &Rc<i32>) -> i32 { let c = Rc::clone(r); *c }, before and
// after optimisation. With rustc 1.97 -O the increment and decrement are
// gone; only the clone's overflow check (strong == usize::MAX) is left.
const BEFORE = ['strong += 1   (clone)', 'check: overflow?', 'load the i32', 'strong -= 1   (drop)', 'if 0: free'];
const AFTER = ['', 'check: overflow?', 'load the i32', '', ''];

export default function ElisionFigure() {
  return (
    <Svg w={400} h={210} title="Before optimisation peek increments and decrements the count around the load; after, only the load and an overflow check remain">
      <T x={100} y={14} size={11} weight={700} anchor="middle" fill={tok('muted')}>AS WRITTEN</T>
      <T x={300} y={14} size={11} weight={700} anchor="middle" fill={tok('muted')}>rustc -O</T>
      {BEFORE.map((t, k) => {
        const y = 28 + k * 34;
        const rc = k === 0 || k === 3 || k === 4;
        return (
          <g key={k}>
            <Box x={6} y={y} w={188} h={28} fill={rc ? tok('f6', 0.12) : tok('panel')} stroke={rc ? tok('f6') : tok('line')}>
              <T x={14} y={y + 14} size={11} mono>{t}</T>
            </Box>
            {AFTER[k] ? (
              <Box x={206} y={y} w={188} h={28} fill={tok('f3', 0.12)} stroke={tok('f3')}>
                <T x={214} y={y + 14} size={11} mono>{AFTER[k]}</T>
              </Box>
            ) : (
              <T x={300} y={y + 14} size={11} anchor="middle" fill={tok('muted')}>removed</T>
            )}
          </g>
        );
      })}
      <Arrow x1={194} y1={110} x2={204} y2={110} />
    </Svg>
  );
}
