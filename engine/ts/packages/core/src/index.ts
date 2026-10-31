// The Viscosity pipeline: plugin.lower → analyze → plan → plugin.emit.
import { analyze, type Analysis } from './analysis.ts';
import { plan, explain, DEFAULT_OPTIONS, type Plan, type PlanOptions } from './plan.ts';
import type { LanguagePlugin } from './plugin.ts';

export * from './vir.ts';
export * from './plan.ts';
export * from './plugin.ts';
export * from './analysis.ts';
export { dominators, naturalLoops, reversePostorder } from './cfg.ts';

export interface CompileResult {
  code: string;
  plan: Plan;
  analysis: Analysis;
  explain: string;
}

export function compile(source: string, plugin: LanguagePlugin, opts: Partial<PlanOptions> = {}): CompileResult {
  const lowered = plugin.lower(source);
  const analysis = analyze(lowered.module);
  const p = plan(analysis, { ...DEFAULT_OPTIONS, ...opts, annotations: opts.annotations ?? lowered.annotations });
  const code = plugin.emit(source, lowered, p);
  return { code, plan: p, analysis, explain: explain(p) };
}
