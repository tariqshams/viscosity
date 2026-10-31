// The Python language plugin for Viscosity (milestone M7).
import type { Annotation, LanguagePlugin, LoweredModule, Plan } from '../../core/src/index.ts';
import { parsePython } from './parser.ts';
import { PySyntaxError } from './tokens.ts';
import { ModuleBuilder } from '../../core/src/builder.ts';
import { lowerPython, type PyLowered } from './lower.ts';
import { emitPython } from './emit.ts';

type Lowered = LoweredModule & { low: PyLowered | null; unsupported?: string };

export function pythonPlugin(): LanguagePlugin {
  return {
    id: 'python',
    extensions: ['.py'],
    lower(source: string): Lowered {
      let low: PyLowered;
      try {
        low = lowerPython(parsePython(source), source);
      } catch (e) {
        // Outside the supported subset: leave the file exactly as it is.
        if (!(e instanceof PySyntaxError)) throw e;
        const mb = new ModuleBuilder('python', source);
        mb.newFunction('<module>').finish();
        return { module: mb.module, annotations: new Map(), low: null, unsupported: e.message };
      }
      // `# @viscosity soa` on the line above `xs = []` (module level).
      const annotations = new Map<number, Annotation>();
      const lines = source.split('\n');
      lines.forEach((l, i) => {
        const m = /#\s*@viscosity\s+(soa|aos)\b/.exec(l);
        const next = lines[i + 1] ?? '';
        const target = /^([A-Za-z_]\w*)\s*=/.exec(next);
        if (!m || !target) return;
        const b = low.module.bindings.find((x) => x.name === target[1] && x.owner === low.module.main);
        if (b) annotations.set(b.id, { layout: m[1] as Annotation['layout'], line: i + 1 });
      });
      return { module: low.module, annotations, low };
    },
    emit(source: string, lowered: LoweredModule, plan: Plan): string {
      const l = lowered as Lowered;
      return l.low ? emitPython(source, l.low, plan) : source;
    },
  };
}
