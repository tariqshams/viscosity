// Chapter 240: the swap problem. Two copies run one after the other lose a
// value; a spare register keeps it.
import { Box, Svg, T, tok } from '../../viz/svg';

const ROWS_BAD = [['start', '5', '6'], ['p = q', '6', '6'], ['q = p', '6', '6']];
const ROWS_OK = [['start', '5', '6'], ['t = p', '5', '6'], ['p = q', '6', '6'], ['q = t', '6', '5']];

function Table({ x, title, rows, ok }: { x: number; title: string; rows: string[][]; ok: boolean }) {
  return (
    <g>
      <T x={x} y={14} size={11} weight={700} fill={tok('muted')}>{title}</T>
      <T x={x + 96} y={36} size={11.5} weight={700} anchor="middle" fill={tok('muted')}>p</T>
      <T x={x + 146} y={36} size={11.5} weight={700} anchor="middle" fill={tok('muted')}>q</T>
      {rows.map((r, k) => (
        <g key={k}>
          <T x={x} y={58 + k * 24} size={12.5} mono>{r[0]}</T>
          <Box x={x + 76} y={46 + k * 24} w={40} h={22}><T x={x + 96} y={58 + k * 24} size={13} mono anchor="middle">{r[1]}</T></Box>
          <Box x={x + 126} y={46 + k * 24} w={40} h={22}><T x={x + 146} y={58 + k * 24} size={13} mono anchor="middle">{r[2]}</T></Box>
        </g>
      ))}
      <T x={x} y={164} size={12.5} weight={700} fill={ok ? tok('safe') : tok('danger')}>{ok ? 'swapped: p = 6, q = 5' : 'lost: both are 6'}</T>
    </g>
  );
}

export default function SwapFigure() {
  return (
    <Svg w={400} h={176} title="Swapping p and q: two plain copies lose p's value; three copies through t keep it.">
      <Table x={6} title="TWO COPIES IN A ROW" rows={ROWS_BAD} ok={false} />
      <Table x={214} title="THROUGH A SPARE t" rows={ROWS_OK} ok={true} />
    </Svg>
  );
}
