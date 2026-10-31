// The concept registry: every idea the book teaches, by id.
//
// Book rule: nothing is used before it has been introduced. The outline
// (./outline/partN.js) says which chapter introduces each concept. Every
// chapter's frontmatter `introduces` must match its outline entry, and
// `uses` may only name concepts introduced by an earlier chapter (or in
// ASSUMED, the reader's starting knowledge). scripts/check_chapters.mjs
// enforces both rules.
import { OUTLINE } from './outline/index.js';

/** What the reader already knows on page one: "a little JavaScript". */
export const ASSUMED = {
  variables: 'let and const: giving a value a name',
  numbers: 'numbers and arithmetic (+ - * / %)',
  strings: 'text in quotes, joined with +',
  booleans: 'true and false',
  comparison: '=== !== < > <= >=',
  'logical-operators': '&& || ! for combining conditions',
  if: 'if / else',
  'for-loop': 'for (let i = 0; i < n; i++)',
  'console-log': 'console.log(...) to print',
};

/** id -> { description, n }: the chapter that introduces it. */
export const CONCEPTS = Object.fromEntries(
  OUTLINE.flatMap((c) => Object.entries(c.introduces).map(([id, d]) => [id, { description: d, n: c.n }])),
);

/** Concepts a reader knows when starting chapter n. */
export function knownBefore(n) {
  const known = new Set(Object.keys(ASSUMED));
  for (const [id, c] of Object.entries(CONCEPTS)) if (c.n < n) known.add(id);
  return known;
}
