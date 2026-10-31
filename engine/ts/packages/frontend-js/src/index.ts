// The JavaScript/TypeScript language plugin for Viscosity.
import * as acorn from 'acorn';
import type { Annotation, LanguagePlugin, LoweredModule, Plan } from '../../core/src/index.ts';
import type { BindingId } from '../../core/src/vir.ts';
import type { Node } from './estree.ts';
import { resolveScopes, type Resolution } from './resolve.ts';
import { lower } from './lower.ts';
import { emitJs } from './emit.ts';
import { stripTypes } from './parse.ts';
import { parseMini } from './mini-parser.ts';

interface JsLowered extends LoweredModule {
  program: Node;
  resolution: Resolution;
  /** the JavaScript actually analyzed (TypeScript is stripped first) */
  js: string;
}

const ANN = /@viscosity\s+(aosoa|soa|aos)\b(?:\((\d+)\))?/;

export function jsPlugin(opts: { parser?: 'acorn' | 'mini'; typescript?: boolean } = {}): LanguagePlugin {
  return {
    id: 'javascript',
    extensions: ['.js', '.mjs', '.ts', '.mts'],
    lower(source: string): JsLowered {
      const js = opts.typescript ? stripTypes(source) : source;
      const comments: { value: string; line: number }[] = [];
      const program = opts.parser === 'mini'
        ? parseMini(js, comments)
        : (acorn.parse(js, {
            ecmaVersion: 'latest', sourceType: 'module', locations: true,
            onComment: (_block, value, _s, _e, startLoc, endLoc) => comments.push({ value, line: endLoc?.line ?? startLoc?.line ?? 0 }),
          }) as unknown as Node);
      const resolution = resolveScopes(program);
      const lowered = lower(program, js, resolution);
      // `// @viscosity soa` (or aos, aosoa(8)) on the line before a declaration.
      const annotations = new Map<BindingId, Annotation>();
      for (const cm of comments) {
        const m = ANN.exec(cm.value);
        if (!m) continue;
        for (const [jb, id] of lowered.bindingOf) {
          const line = jb.decl?.loc?.start.line;
          if (line === cm.line + 1 || line === cm.line) {
            annotations.set(id, { layout: m[1] as Annotation['layout'], blockSize: m[2] ? Number(m[2]) : undefined, line: cm.line });
          }
        }
      }
      return { module: lowered.module, annotations, program, resolution, js };
    },
    emit(_source: string, lowered: LoweredModule, plan: Plan): string {
      const l = lowered as JsLowered;
      return emitJs(l.js, l.program, l.resolution, plan);
    },
  };
}
