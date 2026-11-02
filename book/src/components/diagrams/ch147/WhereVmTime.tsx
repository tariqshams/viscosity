// Chapter 147: where the two TypeScript implementations spend their time
// on two programs where the VM loses to the tree-walker. Measured for the
// chapter on 2026-11-02 with V8's sampling profiler (`node --cpu-prof
// src/cli.ts [--vm] ../corpus/benchmark/<program>.drip`, Node 22.23.4),
// one profiled run each, self time grouped by source file:
//   loop      vm.ts / interpreter.ts
//   tables    the VM's own table.ts; the tree-walker's runtime.ts
//             (its Map-backed instances and environments)
//   Drip GC   the VM's heap.ts (allocate, collect, blacken)
//   V8 GC     V8's "(garbage collector)" entry
//   other     start-up, module loading, natives
// Shares are of samples, so they carry a few percent of noise.
import { Svg, T, tok } from '../../viz/svg';

type Seg = { k: string; pct: number; col: string };
type Bar = { label: string; segs: Seg[] };

const BARS: Bar[] = [
  { label: 'inst. · VM', segs: [
    { k: 'loop', pct: 47.1, col: 'accent' }, { k: 'tables', pct: 16.0, col: 'warn' },
    { k: 'Drip GC', pct: 9.6, col: 'danger' }, { k: 'V8 GC', pct: 13.3, col: 'f5' }, { k: 'other', pct: 14.0, col: 'muted' }] },
  { label: 'inst. · tree', segs: [
    { k: 'loop', pct: 53.8, col: 'accent' }, { k: 'tables', pct: 20.0, col: 'warn' },
    { k: 'V8 GC', pct: 10.5, col: 'f5' }, { k: 'other', pct: 15.7, col: 'muted' }] },
  { label: 'trees · VM', segs: [
    { k: 'loop', pct: 46.1, col: 'accent' }, { k: 'tables', pct: 10.9, col: 'warn' },
    { k: 'Drip GC', pct: 18.0, col: 'danger' }, { k: 'V8 GC', pct: 14.5, col: 'f5' }, { k: 'other', pct: 10.5, col: 'muted' }] },
  { label: 'trees · tree', segs: [
    { k: 'loop', pct: 57.7, col: 'accent' }, { k: 'tables', pct: 18.5, col: 'warn' },
    { k: 'V8 GC', pct: 12.5, col: 'f5' }, { k: 'other', pct: 11.3, col: 'muted' }] },
];

const KEYS = [
  { k: 'loop', col: 'accent' }, { k: 'tables', col: 'warn' }, { k: 'Drip GC', col: 'danger' },
  { k: 'V8 GC', col: 'f5' }, { k: 'other', col: 'muted' },
];

export default function WhereVmTime() {
  const L = 96;
  const W = 296;
  return (
    <Svg w={400} h={200} title="Shares of profile samples for the TypeScript VM and tree-walker on instantiation.drip and trees.drip">
      <T x={4} y={12} size={12} weight={700}>Where the time goes (V8 sampling profiler)</T>
      {BARS.map((b, i) => {
        const y = 30 + i * 30;
        let x = L;
        return (
          <g key={b.label}>
            <T x={L - 6} y={y + 11} size={11} mono anchor="end">{b.label}</T>
            {b.segs.map((sg) => {
              const w = (sg.pct / 100) * W;
              const x0 = x;
              x += w;
              return (
                <g key={sg.k}>
                  <rect x={x0} y={y} width={w - 1} height={22} fill={tok(sg.col, 0.45)} />
                  {w > 30 && <T x={x0 + w / 2} y={y + 11} size={11} mono anchor="middle">{Math.round(sg.pct)}</T>}
                </g>
              );
            })}
          </g>
        );
      })}
      {KEYS.map((k, i) => (
        <g key={k.k}>
          <rect x={4 + i * 78} y={160} width={10} height={10} fill={tok(k.col, 0.45)} />
          <T x={18 + i * 78} y={165} size={11}>{k.k}</T>
        </g>
      ))}
      <T x={4} y={188} size={11} fill={tok('muted')}>Per cent of samples, one profiled run each.</T>
    </Svg>
  );
}
