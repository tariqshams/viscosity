// The real VIR control-flow graph of
//   function g(n) {
//     while (n > 1) {
//       if (n % 2) n = 3 * n + 1; else n = n / 2;
//     }
//     return n;
//   }
// as printed by printFunc (chapters 124 and 125 draw it).
import { Arrow, Box, T, tok } from '../../viz/svg';

export const BW = 92;
export const BH = 34;

export const BLOCKS: { id: number; x: number; y: number; text: string }[] = [
  { id: 0, x: 225, y: 22, text: 'entry' },
  { id: 1, x: 225, y: 82, text: 'n > 1 ?' },
  { id: 2, x: 155, y: 146, text: 'n % 2 ?' },
  { id: 4, x: 340, y: 146, text: 'return n' },
  { id: 5, x: 90, y: 210, text: 'n = 3n+1' },
  { id: 6, x: 225, y: 210, text: 'n = n/2' },
  { id: 7, x: 155, y: 274, text: 'join' },
  { id: 3, x: 155, y: 334, text: 'br b1' },
];

/** successors, exactly as cfg.ts's successors() returns them */
export const SUCC: Record<number, number[]> = { 0: [1], 1: [2, 4], 2: [5, 6], 3: [1], 4: [], 5: [7], 6: [7], 7: [3] };

export const at = (id: number) => BLOCKS.find((b) => b.id === id)!;

export function Edge({ from, to, color, width }: { from: number; to: number; color?: string; width?: number }) {
  const a = at(from), b = at(to);
  if (from === 3 && to === 1) {
    // the back edge: out to the left margin and up to b1
    const x1 = a.x - BW / 2, y1 = a.y, x2 = b.x - BW / 2, y2 = b.y;
    const c = color ?? tok('ink', 0.7);
    return (
      <g>
        <path d={`M${x1},${y1} C${-12},${y1} ${-12},${y2} ${x2 - 7},${y2}`} fill="none" stroke={c} strokeWidth={width ?? 2} />
        <polygon points={`${x2},${y2} ${x2 - 9},${y2 - 5} ${x2 - 9},${y2 + 5}`} fill={c} />
      </g>
    );
  }
  const down = b.y > a.y;
  return <Arrow x1={a.x + (b.x - a.x) * 0.25} y1={a.y + (down ? BH / 2 : -BH / 2)} x2={b.x - (b.x - a.x) * 0.1} y2={b.y + (down ? -BH / 2 : BH / 2)} color={color} width={width} />;
}

export function BlockBox({ id, fill, stroke, sub, dim }: { id: number; fill?: string; stroke?: string; sub?: string; dim?: boolean }) {
  const b = at(id);
  return (
    <g>
    <rect x={b.x - BW / 2} y={b.y - BH / 2} width={BW} height={BH} rx={5} fill={tok('paper')} />
    <Box x={b.x - BW / 2} y={b.y - BH / 2} w={BW} h={BH} fill={fill ?? tok('panel')} stroke={stroke ?? tok('line')} opacity={dim ? 0.45 : 1}>
      <T x={b.x - BW / 2 + 6} y={b.y - 7} size={11} weight={700} fill={tok('accent')}>{`b${id}`}</T>
      <T x={b.x + BW / 2 - 6} y={b.y + 7} size={10} mono anchor="end">{sub ?? b.text}</T>
    </Box>
    </g>
  );
}
