// Two LR(0) states whose table rows have a cell with two actions in it:
// a shift/reduce conflict (state 2 of the grammar with *) and a
// reduce/reduce conflict (the x grammar).
import { Box, Svg, T, tok } from '../../viz/svg';

function Row({ y, title, items, cols, cells, bad }: { y: number; title: string; items: string[]; cols: string[]; cells: string[]; bad: number[] }) {
  return (
    <g>
      <Box x={4} y={y} w={140} h={24 + items.length * 17}>
        <T x={12} y={y + 13} size={12} weight={700} fill={tok('muted')}>{title}</T>
        {items.map((t, k) => <T key={k} x={14} y={y + 32 + k * 17} size={12} mono>{t}</T>)}
      </Box>
      {cols.map((c, k) => {
        const x = 154 + k * 40;
        const isBad = bad.includes(k);
        return (
          <g key={c}>
            <T x={x + 18} y={y + 10} size={12} mono anchor="middle" weight={700} fill={tok('muted')}>{c}</T>
            <Box x={x} y={y + 20} w={36} h={34} fill={isBad ? tok('danger', 0.14) : tok('panel')} stroke={isBad ? tok('danger') : tok('line')}>
              {cells[k].split('/').map((a, j, arr) => (
                <T key={j} x={x + 18} y={y + 37 + (j - (arr.length - 1) / 2) * 13} size={11} mono anchor="middle" weight={isBad ? 700 : 400} fill={isBad ? tok('danger') : undefined}>{a}</T>
              ))}
            </Box>
          </g>
        );
      })}
    </g>
  );
}

export default function ConflictCell() {
  return (
    <Svg w={400} h={190} title="Two table rows with a conflict: shift 7 or reduce 2 under *, and reduce 3 or reduce 4 under every token">
      <Row y={6} title="state 2" items={['E → T ·', 'T → T · * F']} cols={['n', '+', '*', '(', ')', '$']} cells={['r2', 'r2', 's7/r2', 'r2', 'r2', 'r2']} bad={[2]} />
      <Row y={104} title="state 4" items={['A → x ·', 'B → x ·']} cols={['x', '$']} cells={['r3/r4', 'r3/r4']} bad={[0, 1]} />
      <T x={250} y={145} size={11} fill={tok('muted')}>two complete items:</T>
      <T x={250} y={160} size={11} fill={tok('muted')}>reduce/reduce</T>
      <T x={250} y={175} size={11} fill={tok('muted')}>in every column</T>
    </Svg>
  );
}
