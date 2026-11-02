// The plugin API (the book's chapter “The plugin API”). A language plugin turns its source into
// VIR and, given a layout plan, rewrites its source. The core never sees
// language syntax, so adding a language means writing one of these.
import type { Module } from './vir.ts';
import type { Annotation, Plan } from './plan.ts';
import type { BindingId } from './vir.ts';

export interface LoweredModule {
  module: Module;
  /** `@viscosity` annotations found in the source */
  annotations: Map<BindingId, Annotation>;
}

export interface LanguagePlugin {
  /** e.g. 'javascript', 'python' */
  id: string;
  /** file extensions this plugin handles */
  extensions: string[];
  /** parse and lower source to VIR */
  lower(source: string, filename?: string): LoweredModule;
  /** rewrite the source according to the plan */
  emit(source: string, lowered: LoweredModule, plan: Plan): string;
}

/** A layout strategy: how a collection is stored. Strategies are plugins too. */
export interface LayoutStrategy {
  id: string;
  describe: string;
}

export const STRATEGIES: LayoutStrategy[] = [
  { id: 'aos', describe: 'leave it as an array of objects' },
  { id: 'soa', describe: 'one Float64Array per field (struct of arrays)' },
  { id: 'aosoa', describe: 'blocks of N elements, field-major inside a block (array of structs of arrays)' },
];
