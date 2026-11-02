// The tiny grammar used by both chapter 77 diagrams.
export type Rule = { lhs: string; rhs: string[] };

export const NONTERMINALS = new Set(['stmt', 'expr', 'item']);

export const RULES: Rule[] = [
  { lhs: 'stmt', rhs: ['print', 'expr', ';'] },
  { lhs: 'expr', rhs: ['expr', '+', 'item'] },
  { lhs: 'expr', rhs: ['item'] },
  { lhs: 'item', rhs: ['NUMBER'] },
  { lhs: 'item', rhs: ['(', 'expr', ')'] },
];

export const ruleText = (r: Rule) => `${r.lhs} → ${r.rhs.map((s) => (NONTERMINALS.has(s) || s === 'NUMBER' ? s : `"${s}"`)).join(' ')}`;

export const isNT = (s: string) => NONTERMINALS.has(s);

/** Index of the leftmost nonterminal, or -1 if the form is a sentence. */
export const leftmost = (form: string[]) => form.findIndex(isNT);

/** Replace the leftmost nonterminal using rule r. */
export function apply(form: string[], r: Rule): string[] {
  const k = leftmost(form);
  return [...form.slice(0, k), ...r.rhs, ...form.slice(k + 1)];
}

/** Width of a symbol chip in the 400-wide viewBox. */
export const chipW = (s: string) => Math.max(18, s.length * 7.6 + 10);
