// LALR merging two LR(1) states with the same core: their lookaheads are
// united, and here that makes a reduce/reduce conflict LR(1) did not have.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

function State({ x, y, title, rows, bad }: { x: number; y: number; title: string; rows: [string, string][]; bad?: boolean }) {
  return (
    <Box x={x} y={y} w={180} h={64} stroke={bad ? tok('danger') : tok('line')} fill={bad ? tok('danger', 0.08) : tok('panel')}>
      <T x={x + 8} y={y + 13} size={11} weight={700} fill={tok('muted')}>{title}</T>
      {rows.map(([it, la], k) => (
        <g key={k}>
          <T x={x + 10} y={y + 33 + k * 18} size={12} mono>{it}</T>
          <T x={x + 170} y={y + 33 + k * 18} size={12} mono anchor="end" weight={700} fill={bad ? tok('danger') : tok('accent')}>{la}</T>
        </g>
      ))}
    </Box>
  );
}

export default function MergeConflict() {
  return (
    <Svg w={400} h={206} title="Two LR(1) states, A → c · with d and B → c · with e, and A → c · with e and B → c · with d, merge into one state where both reductions want d and e">
      <State x={4} y={4} title="after a c" rows={[['A → c ·', 'd'], ['B → c ·', 'e']]} />
      <State x={216} y={4} title="after b c" rows={[['A → c ·', 'e'], ['B → c ·', 'd']]} />
      <Arrow x1={94} y1={72} x2={180} y2={110} color={tok('ink', 0.5)} />
      <Arrow x1={306} y1={72} x2={220} y2={110} color={tok('ink', 0.5)} />
      <T x={200} y={92} size={11} anchor="middle" fill={tok('muted')}>same core: merge</T>
      <State x={110} y={114} title="LALR state" rows={[['A → c ·', 'd e'], ['B → c ·', 'd e']]} bad />
      <T x={200} y={196} size={12} anchor="middle" fill={tok('danger')} weight={700}>on d and on e: reduce by A or by B?</T>
    </Svg>
  );
}
