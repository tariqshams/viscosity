import m from '../../../../../engine/ts/packages/bench/results/matrix-2026-10-31.json';

// Chapter 344 (and 200): a number from the benchmark matrix, for prose,
// read from engine/ts/packages/bench/results/matrix-2026-10-31.json so that
// no figure is typed in by hand. `k` names the figure.
type Side = { originalMs: { best: number }; viscosityMs: { best: number }; speedupBest: number };
const row = (p: string) => (m.e2e.rows as { program: string; node: Side; bun: Side }[]).find((r) => r.program === p)!;
const x = (v: number) => `${v}×`;
const ms = (v: number) => `${v} ms`;

const FIGS: Record<string, () => string> = {
  nodeGeo: () => x(m.e2e.summary.node.geomeanSpeedupBest),
  bunGeo: () => x(m.e2e.summary.bun.geomeanSpeedupBest),
  heatNode: () => x(row('heat').node.speedupBest),
  heatBun: () => x(row('heat').bun.speedupBest),
  heatNodeOrig: () => ms(row('heat').node.originalMs.best),
  heatBunOrig: () => ms(row('heat').bun.originalMs.best),
  nbodyBun: () => x(row('nbody').bun.speedupBest),
  bunOrig: () => x(m.e2e.summary.bunVsNode.originalGeomean),
  bunComp: () => x(m.e2e.summary.bunVsNode.viscosityGeomean),
  cli: () => x(m.compileSpeed.cli.totalSpeedup),
  inproc: () => x(m.compileSpeed.inProcess.totalSpeedup),
  tsCliTotal: () => ms(m.compileSpeed.cli.totalMedianMs.ts),
  tsInprocTotal: () => ms(Math.round(m.compileSpeed.inProcess.totalMedianUs.ts / 100) / 10),
  programs: () => String(m.compileSpeed.programs),
  vmVsTree: () => x(m.drip.geomean.vmVsTree),
  rustVsVm: () => x(m.drip.geomean.rustVsVm),
  rustVsTree: () => x(m.drip.geomean.rustVsTree),
  runs: () => String(m.meta.settings.e2eRuns),
  bun: () => m.meta.versions.bun,
};

export default function Num({ k }: { k: string }) {
  const f = FIGS[k];
  if (!f) throw new Error(`Num: unknown figure ${k}`);
  return <span className="tabular-nums">{f()}</span>;
}
