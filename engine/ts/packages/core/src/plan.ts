// The planner and cost model (book chapters 100–101): decide, for every
// collection, which layout to use and record WHY, so `viscosity explain`
// can tell the programmer.
import type { Analysis, Collection } from './analysis.ts';
import type { BindingId, SourceRef } from './vir.ts';

export type Layout = 'aos' | 'soa' | 'aosoa';

export interface Annotation { layout: Layout; blockSize?: number; line: number }

export interface PlanOptions {
  /** auto: decide everything; opt-in: only touch annotated collections */
  mode: 'auto' | 'opt-in';
  /** below this many (estimated) elements, leave it alone */
  minSize: number;
  /** check: insert bounds checks where not proven; assume: trust the program */
  bounds: 'check' | 'assume';
  /** `@viscosity soa` style annotations, keyed by binding */
  annotations: Map<BindingId, Annotation>;
  /** element counts measured by a profiling run (PGO), keyed by binding name */
  profile?: Record<string, { maxLength: number; fieldReads?: Record<string, number> }>;
  /** Python only: transform without annotations. Off by default because in
   *  CPython column access measured slower per element than attribute access
   *  (the win is memory, about 5x less). */
  pythonAuto?: boolean;
}

export const DEFAULT_OPTIONS: PlanOptions = { mode: 'auto', minSize: 64, bounds: 'check', annotations: new Map() };

export interface CollectionPlan {
  collection: Collection;
  layout: Layout;
  blockSize: number;
  reasons: string[];
}

export interface Plan {
  collections: CollectionPlan[];
  options: PlanOptions;
}

export function plan(a: Analysis, opts: PlanOptions = DEFAULT_OPTIONS): Plan {
  const out: CollectionPlan[] = [];
  for (const c of a.collections) {
    const ann = opts.annotations.get(c.binding);
    const keep = (...reasons: string[]): CollectionPlan => ({ collection: c, layout: 'aos', blockSize: 0, reasons });
    if (c.bailouts.length) {
      out.push(keep(...c.bailouts.map((b) => `unsafe: ${b}`)));
      continue;
    }
    const B = ann?.blockSize ?? 8;
    if (ann && ann.layout === 'aosoa' && !(B >= 2 && Number.isInteger(Math.log2(B)))) {
      out.push(keep(`annotated aosoa(${B}), but the block size must be a power of two (2, 4, 8, 16, ...)`));
      continue;
    }
    if (ann && ann.layout === 'aosoa' && c.numericFields.size !== c.fields.length) {
      out.push(keep(`annotated aosoa, but fields ${c.fields.filter((f) => !c.numericFields.has(f)).join(', ')} may hold non-numbers`));
      continue;
    }
    if (ann) {
      if (ann.layout === 'aos') { out.push(keep(`annotated @viscosity aos at line ${ann.line}`)); continue; }
      out.push({
        collection: c, layout: ann.layout, blockSize: ann.blockSize ?? 8,
        reasons: [`annotated @viscosity ${ann.layout}${ann.layout === 'aosoa' ? `(${ann.blockSize ?? 8})` : ''} at line ${ann.line}`, ...describe(c, c.sizeEstimate, false, a.module.language)],
      });
      continue;
    }
    if (opts.mode === 'opt-in') { out.push(keep('opt-in mode: not annotated')); continue; }
    if (a.module.language === 'python' && !opts.pythonAuto) {
      out.push(keep('CPython: column access measured slower per element than objects (the win is about 5x less memory); add "# @viscosity soa" above the list to opt in'));
      continue;
    }
    if (c.numericFields.size === 0) {
      out.push(keep('no field is provably numeric, so there are no typed columns to gain'));
      continue;
    }
    const fieldLoops = c.loops.filter((l) => l.depth > 0);
    if (fieldLoops.length === 0) {
      out.push(keep('no loop reads or writes its fields, so a new layout cannot pay off'));
      continue;
    }
    const measured = opts.profile?.[c.name]?.maxLength;
    const size = measured ?? c.sizeEstimate;
    if (size !== null && size < opts.minSize) {
      out.push(keep(`${measured === undefined && c.sizeIsUpperBound ? 'at most' : 'about'} ${size} elements${measured !== undefined ? ' (measured)' : ''}: below the ${opts.minSize}-element threshold, where the benefit is too small`));
      continue;
    }
    out.push({ collection: c, layout: 'soa', blockSize: 0, reasons: describe(c, size, measured !== undefined, a.module.language) });
  }
  return { collections: out, options: opts };
}

function describe(c: Collection, size: number | null = c.sizeEstimate, measured = false, language = 'javascript'): string[] {
  const typedName = language === 'python' ? "array('d')" : 'Float64Array';
  const plainName = language === 'python' ? 'list' : 'plain array';
  const r: string[] = [];
  const F = c.fields.length;
  for (const l of c.loops.filter((l) => l.depth > 0)) {
    const touched = new Set([...l.reads, ...l.writes]).size;
    r.push(`loop at line ${l.line} in ${l.func}() touches ${touched} of ${F} fields (${[...new Set([...l.reads, ...l.writes])].join(', ')})`);
  }
  const generic = c.fields.filter((f) => !c.numericFields.has(f));
  r.push(generic.length
    ? `typed ${typedName} columns for ${c.fields.filter((f) => c.numericFields.has(f)).join(', ') || 'no fields'}; ${plainName} columns for ${generic.join(', ')} (${language === 'python' ? 'may hold non-floats' : 'may hold non-numbers'})`
    : `typed ${typedName} columns for all ${c.fields.length} fields`);
  r.push(size === null ? 'size unknown statically' : `${!measured && c.sizeIsUpperBound ? 'at most' : 'about'} ${size} elements${measured ? ' (measured by profiling)' : ''}`);
  const proven = c.indexGets.filter((g) => g.boundsProven).length;
  r.push(`${proven} of ${c.indexGets.length} element accesses proven in bounds`);
  return r;
}

export interface ExplainOptions {
  /** The source the plan was made from (as the plugin lowered it). When
   *  given, each refusal is followed by a code frame: the offending line
   *  and carets under the code it is about (`viscosity explain --frames`). */
  frames?: string;
}

/** The text of `viscosity explain` (book chapter 110). */
export function explain(p: Plan, opts: ExplainOptions = {}): string {
  const lines: string[] = [];
  for (const cp of p.collections) {
    const c = cp.collection;
    const verdict = cp.layout === 'aos' ? 'kept as array of objects' : cp.layout === 'soa' ? 'struct of arrays' : `AoSoA, blocks of ${cp.blockSize}`;
    lines.push(`${c.name} (line ${c.line}) {${c.fields.join(', ')}} → ${verdict}`);
    // A collection with bailouts is kept with exactly one reason per bailout.
    const refused = c.bailouts.length > 0 && cp.reasons.length === c.bailouts.length;
    cp.reasons.forEach((r, k) => {
      lines.push(`  · ${r}`);
      const at = refused && opts.frames !== undefined ? c.bailoutSites.get(c.bailouts[k]) : null;
      if (at) lines.push(codeFrame(opts.frames!, at));
    });
  }
  return lines.join('\n');
}

const isLineBreak = (ch: string) => ch === '\n' || ch === '\r' || ch === '\u2028' || ch === '\u2029';

/**
 * A code frame, as rustc and tsc print them: the source line where `at`
 * starts, with its line number, and carets under the code `at` covers (to
 * the end of that line). Columns count code points; tabs before the code
 * are kept in the caret line so the carets line up.
 *
 *         5 | keep.push(ps[i]);
 *           |           ^^^^^
 */
export function codeFrame(source: string, at: SourceRef, indent = '    '): string {
  let s = at.start;
  while (s > 0 && !isLineBreak(source[s - 1])) s--;
  let e = at.start;
  while (e < source.length && !isLineBreak(source[e])) e++;
  let text = source.slice(s, e);
  let t = text.length;
  while (t > 0 && (text[t - 1] === ' ' || text[t - 1] === '\t')) t--;
  text = text.slice(0, t);
  const before = Array.from(source.slice(s, at.start));
  const upTo = Array.from(source.slice(s, Math.min(Math.max(at.end, at.start), e))).length;
  const width = Math.max(1, Math.min(upTo, Array.from(text).length) - before.length);
  const pad = before.map((ch) => (ch === '\t' ? '\t' : ' ')).join('');
  const num = String(at.line);
  const gutter = ' '.repeat(num.length);
  return `${indent}${num} |${text ? ' ' + text : ''}\n${indent}${gutter} | ${pad}${'^'.repeat(width)}`;
}
