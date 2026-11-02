// The lattice of subsets of {a, b, c}, drawn as a Hasse diagram (a line
// wherever one set sits directly above another), with the biggest set at
// the top. Shared by the lattices chapter's figure and stepper.
import { Box, T, tok } from '../../viz/svg';

export const SETS: { k: string; x: number; y: number }[] = [
  { k: 'abc', x: 130, y: 24 },
  { k: 'ab', x: 60, y: 86 }, { k: 'ac', x: 130, y: 86 }, { k: 'bc', x: 200, y: 86 },
  { k: 'a', x: 60, y: 148 }, { k: 'b', x: 130, y: 148 }, { k: 'c', x: 200, y: 148 },
  { k: '', x: 130, y: 210 },
];
const pos = (k: string) => SETS.find((s) => s.k === k)!;
export const label = (k: string) => (k === '' ? '{ }' : `{${k.split('').join(', ')}}`);
const covers = (hi: string, lo: string) => hi.length === lo.length + 1 && lo.split('').every((c) => hi.includes(c));

export function Cube({ hot, mark, path = [] }: { hot?: string; mark?: string[]; path?: string[] }) {
  const lines = [];
  for (const h of SETS) for (const l of SETS) {
    if (!covers(h.k, l.k)) continue;
    const onPath = path.some((p, i) => p === h.k && path[i + 1] === l.k);
    lines.push(
      <line key={h.k + '>' + l.k} x1={h.x} y1={h.y + 12} x2={l.x} y2={l.y - 12}
        stroke={onPath ? tok('brand') : tok('ink', 0.4)} strokeWidth={onPath ? 3 : 1.4} />,
    );
  }
  return (
    <g>
      {lines}
      {SETS.map((s) => {
        const h = s.k === hot;
        const m = mark?.includes(s.k);
        return (
          <Box key={s.k} x={s.x - 33} y={s.y - 12} w={66} h={24}
            fill={h ? tok('brand', 0.2) : m ? tok('accent', 0.14) : tok('panel')}
            stroke={h ? tok('brand') : m ? tok('accent') : tok('line')}>
            <T x={s.x} y={s.y} size={11.5} mono anchor="middle" weight={h ? 700 : 400}>{label(s.k)}</T>
          </Box>
        );
      })}
    </g>
  );
}

export const at = pos;
