// Chapter 236: one trip of the list-scheduled loop (8 cycles, 3 stalls)
// against one pass of the pipelined kernel (5 cycles, no stalls), on the
// toy machine. Kernel cells say which element each instruction works on.
import { Box, Svg, T, tok } from '../../viz/svg';

type Cell = { op: string; who?: string } | null;
const PLAIN: Cell[] = [{ op: 'ld' }, null, null, { op: 'mul' }, { op: 'addi' }, null, { op: 'add' }, { op: 'bne' }];
const KERNEL: Cell[] = [{ op: 'add', who: 'i' }, { op: 'mul', who: 'i+1' }, { op: 'ld', who: 'i+2' }, { op: 'addi' }, { op: 'bne' }];
const CW = 40;
const X0 = 70;

function Row({ y, label, sub, cells }: { y: number; label: string; sub: string; cells: Cell[] }) {
  return (
    <g>
      <T x={8} y={y + 10} size={12} weight={700}>{label}</T>
      <T x={8} y={y + 26} size={11} fill={tok('muted')}>{sub}</T>
      {cells.map((c, k) => (
        <g key={k}>
          <Box x={X0 + k * CW + 2} y={y} w={CW - 4} h={32} r={4}
            fill={c ? tok('brand', 0.16) : tok('warn', 0.25)} stroke={c ? tok('brand') : tok('warn')}>
            <T x={X0 + k * CW + CW / 2} y={y + (c?.who ? 11 : 16)} size={11} mono anchor="middle">{c ? c.op : 'stall'}</T>
            {c?.who && <T x={X0 + k * CW + CW / 2} y={y + 24} size={11} anchor="middle" fill={tok('muted')}>{c.who}</T>}
          </Box>
          <T x={X0 + k * CW + CW / 2} y={y + 44} size={11} mono anchor="middle" fill={tok('muted')}>{k}</T>
        </g>
      ))}
    </g>
  );
}

export default function KernelFigure() {
  return (
    <Svg w={400} h={150} title="Top row: one trip of the list-scheduled loop takes 8 cycles with stalls in cycles 1, 2 and 5. Bottom row: one pass of the pipelined kernel takes 5 cycles with no stalls; its add, mul and ld work on elements i, i+1 and i+2.">
      <Row y={8} label="one trip" sub="8 cycles" cells={PLAIN} />
      <Row y={84} label="kernel" sub="5 cycles" cells={KERNEL} />
    </Svg>
  );
}
