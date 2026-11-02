import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const ROWS = [
  { code: 'p.move()', sub: 'p is before the dot', res: 'this = p', ok: true },
  { code: 'const m = p.move; m()', sub: 'nothing before the dot', res: 'this = undefined', ok: false },
  { code: 'twice(p.move)', sub: 'only the function travels', res: 'this = undefined', ok: false },
  { code: 'twice(() => p.move())', sub: 'the arrow keeps the dot', res: 'this = p', ok: true },
];

/** The same method, four ways of calling it, and what this becomes. */
export default function DotDecides() {
  return (
    <Svg w={400} h={232} title="Four ways of calling the same move method. p.move() gives this = p. Taking the method out as m and calling m() gives this = undefined. Passing p.move to twice also gives undefined. Passing an arrow function that calls p.move() gives this = p.">
      <T x={6} y={12} size={11} weight={700} fill={tok('muted')}>HOW IT IS CALLED</T>
      <T x={394} y={12} size={11} weight={700} anchor="end" fill={tok('muted')}>THIS INSIDE move</T>
      {ROWS.map((r, i) => {
        const y = 28 + i * 50;
        const c = r.ok ? tok('safe') : tok('danger');
        return (
          <g key={r.code}>
            <T x={6} y={y + 12} size={13} mono weight={700}>{r.code}</T>
            <T x={6} y={y + 30} size={11} fill={tok('muted')}>{r.sub}</T>
            <Arrow x1={226} y1={y + 20} x2={252} y2={y + 20} color={tok('ink', 0.5)} />
            <Box x={256} y={y + 4} w={138} h={32} fill={r.ok ? tok('safe', 0.12) : tok('danger', 0.1)} stroke={c}>
              <T x={325} y={y + 20} size={12} mono weight={700} anchor="middle" fill={c}>{r.res}</T>
            </Box>
          </g>
        );
      })}
    </Svg>
  );
}
