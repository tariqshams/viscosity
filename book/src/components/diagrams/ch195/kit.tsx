// Shared pieces for the dataflow diagrams (chapters 195 to 199 and their
// second halves): a basic block drawn as a box of code lines, an edge
// between two blocks, and a back edge that loops round the right-hand side.
import { Arrow, Box, T, tok } from '../../viz/svg';

export type Block = { id: string; x: number; y: number; lines: string[]; w?: number };

export const LINE = 14;
export const blockW = (b: Block) => b.w ?? 104;
export const blockH = (b: Block) => 20 + LINE * b.lines.length;

/** A block: its name in the top-left corner, then its code, centred on (x, y). */
export function CfgBlock({ b, fill, stroke, dim }: { b: Block; fill?: string; stroke?: string; dim?: boolean }) {
  const w = blockW(b);
  const h = blockH(b);
  const x = b.x - w / 2;
  const y = b.y - h / 2;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={5} fill={tok('paper')} />
      <Box x={x} y={y} w={w} h={h} fill={fill ?? tok('panel')} stroke={stroke ?? tok('line')} opacity={dim ? 0.45 : 1}>
        <T x={x + 6} y={y + 9} size={11} weight={700} fill={tok('accent')}>{b.id}</T>
        {b.lines.map((l, k) => (
          <T key={k} x={b.x + 8} y={y + 18 + LINE * k} size={11.5} mono anchor="middle">{l}</T>
        ))}
      </Box>
    </g>
  );
}

/** A forward edge from the bottom of a to the top of b. */
export function CfgEdge({ a, b, color, width }: { a: Block; b: Block; color?: string; width?: number }) {
  return (
    <Arrow x1={a.x + (b.x - a.x) * 0.3} y1={a.y + blockH(a) / 2} x2={b.x - (b.x - a.x) * 0.15} y2={b.y - blockH(b) / 2}
      color={color} width={width} />
  );
}

/** A back edge from the right side of a (lower) up to the right side of b. */
export function BackEdge({ a, b, color, width, out = 34 }: { a: Block; b: Block; color?: string; width?: number; out?: number }) {
  const x1 = a.x + blockW(a) / 2;
  const x2 = b.x + blockW(b) / 2;
  const xr = Math.max(x1, x2) + out;
  const c = color ?? tok('ink', 0.7);
  return (
    <g>
      <path d={`M${x1},${a.y} C${xr},${a.y} ${xr},${b.y} ${x2 + 7},${b.y}`} fill="none" stroke={c} strokeWidth={width ?? 2} />
      <polygon points={`${x2},${b.y} ${x2 + 9},${b.y - 5} ${x2 + 9},${b.y + 5}`} fill={c} />
    </g>
  );
}

/** A small rounded label holding a fact, centred on (x, y). */
export function Chip({ x, y, w = 70, text, fill, stroke, bold }: { x: number; y: number; w?: number; text: string; fill?: string; stroke?: string; bold?: boolean }) {
  return (
    <Box x={x - w / 2} y={y - 10} w={w} h={20} r={10} fill={fill ?? tok('panel')} stroke={stroke ?? tok('line')}>
      <T x={x} y={y} size={11.5} mono anchor="middle" weight={bold ? 700 : 400}>{text}</T>
    </Box>
  );
}
