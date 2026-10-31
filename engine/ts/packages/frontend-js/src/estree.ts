// The small slice of ESTree types the front-end touches. Nodes come from
// acorn (or the book's hand-written parser), both producing ESTree with
// start/end offsets and line locations.
export interface Node {
  type: string;
  start: number;
  end: number;
  loc?: { start: { line: number; column: number } };
  [key: string]: any;
}

/** Child nodes of any ESTree node, in source order. */
export function children(n: Node): Node[] {
  const out: Node[] = [];
  for (const key of Object.keys(n)) {
    if (key === 'loc' || key === 'range' || key === 'start' || key === 'end' || key === 'type') continue;
    const v = (n as any)[key];
    if (Array.isArray(v)) {
      for (const c of v) if (c && typeof c.type === 'string') out.push(c);
    } else if (v && typeof v.type === 'string') {
      out.push(v);
    }
  }
  return out.sort((a, b) => a.start - b.start);
}

export const isFunction = (n: Node) =>
  n.type === 'FunctionDeclaration' || n.type === 'FunctionExpression' || n.type === 'ArrowFunctionExpression';

/** Identifiers declared by a binding pattern (x, {a, b: [c]}, ...rest, x = 1). */
export function patternNames(p: Node | null | undefined): Node[] {
  if (!p) return [];
  switch (p.type) {
    case 'Identifier': return [p];
    case 'ObjectPattern': return p.properties.flatMap((q: Node) => patternNames(q.type === 'RestElement' ? q.argument : q.value));
    case 'ArrayPattern': return p.elements.flatMap((e: Node | null) => patternNames(e));
    case 'RestElement': return patternNames(p.argument);
    case 'AssignmentPattern': return patternNames(p.left);
    default: return [];
  }
}
