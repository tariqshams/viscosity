import { Svg, T, tok } from '../../viz/svg';

// What one 64-byte cache line (eight 8-byte numbers) carries into the cache
// for a movement loop that uses x, y, vx and vy, under three layouts of the
// six numeric particle fields of the benchmark (x, y, vx, vy, mass, health).
const COL: Record<string, string> = { x: 'f1', y: 'f2', vx: 'f3', vy: 'f4', m: 'f5', hp: 'f6' };
const HOT = new Set(['x', 'y', 'vx', 'vy']);
const ROWS: { label: string; cells: [string, number][]; used: string }[] = [
  { label: 'records one after another (packed AoS)', cells: [['x', 0], ['y', 0], ['vx', 0], ['vy', 0], ['m', 0], ['hp', 0], ['x', 1], ['y', 1]], used: '6 of 8 slots used' },
  { label: 'hot/cold split: the hot group', cells: [['x', 0], ['y', 0], ['vx', 0], ['vy', 0], ['x', 1], ['y', 1], ['vx', 1], ['vy', 1]], used: '8 of 8 used' },
  { label: 'SoA: the x column', cells: Array.from({ length: 8 }, (_, i) => ['x', i] as [string, number]), used: '8 of 8 used' },
];
const CW = 46;
const X0 = 16;

export default function LineLoads() {
  return (
    <Svg w={400} h={224} title="One 64-byte cache line under three layouts, for a loop that uses x, y, vx and vy: packed records carry two unused fields, a hot group and a SoA column carry only used ones">
      {ROWS.map((r, k) => {
        const y = 16 + k * 70;
        return (
          <g key={k}>
            <T x={X0} y={y} size={12} weight={700}>{r.label}</T>
            {r.cells.map(([f, i], j) => {
              const hot = HOT.has(f);
              return (
                <g key={j}>
                  <rect x={X0 + j * CW + 1} y={y + 12} width={CW - 2} height={28} rx={3} fill={tok(COL[f], hot ? 0.4 : 0.08)} stroke={hot ? tok(COL[f]) : tok('line')} strokeDasharray={hot ? undefined : '4 3'} />
                  <T x={X0 + j * CW + CW / 2} y={y + 26} size={12} mono anchor="middle" fill={hot ? undefined : tok('muted')}>{`${f}${i}`}</T>
                </g>
              );
            })}
            <T x={X0 + 8 * CW} y={y + 52} size={11} anchor="end" fill={tok('muted')}>{r.used}</T>
          </g>
        );
      })}
    </Svg>
  );
}
