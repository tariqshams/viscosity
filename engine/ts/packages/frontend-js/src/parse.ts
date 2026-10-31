// Parsing JavaScript (and TypeScript) for Viscosity (book chapter 92).
// The parser is pluggable: acorn (a mature ESTree parser, MIT) by default,
// or the book's hand-written parser for the teaching subset. TypeScript is
// stripped to JavaScript first with sucrase.
import * as acorn from 'acorn';
import { transform } from 'sucrase';
import type { Node } from './estree.ts';

export type ParserName = 'acorn' | 'mini';

export function stripTypes(source: string): string {
  return transform(source, { transforms: ['typescript'], disableESTransforms: true, keepUnusedImports: true }).code;
}

export function parseJs(source: string, parser: ParserName = 'acorn'): Node {
  if (parser === 'mini') throw new Error('use parseMini from ./mini-parser.ts');
  return acorn.parse(source, { ecmaVersion: 'latest', sourceType: 'module', locations: true }) as unknown as Node;
}
