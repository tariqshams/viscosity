// What the browser playground needs: compile + explain with the JS plugin.
import { compile } from '../core/src/index.ts';
import { jsPlugin } from '../frontend-js/src/index.ts';

export function viscosity(source: string, opts: { mode?: 'auto' | 'opt-in'; bounds?: 'check' | 'assume'; minSize?: number; parser?: 'acorn' | 'mini' } = {}) {
  const r = compile(source, jsPlugin({ parser: opts.parser ?? 'acorn' }), { mode: opts.mode, bounds: opts.bounds, minSize: opts.minSize });
  return {
    code: r.code,
    explain: r.explain,
    collections: r.plan.collections.map((c) => ({
      name: c.collection.name, layout: c.layout, fields: c.collection.fields,
      numericFields: [...c.collection.numericFields], reasons: c.reasons,
    })),
  };
}
