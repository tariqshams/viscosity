// The hand-written parser must be a drop-in replacement for acorn on the
// subset it supports: every program compiles to exactly the same output.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { compile } from '../../core/src/index.ts';
import { jsPlugin } from '../src/index.ts';
import { parseMini } from '../src/mini-parser.ts';

const files = [
  ...readdirSync(join(import.meta.dirname, 'corpus')).map((f) => join(import.meta.dirname, 'corpus', f)),
  ...readdirSync(join(import.meta.dirname, '../../bench/e2e')).map((f) => join(import.meta.dirname, '../../bench/e2e', f)),
];

describe('mini parser vs acorn', () => {
  for (const file of files) {
    it(file.split('/').slice(-2).join('/'), () => {
      const src = readFileSync(file, 'utf8');
      const a = compile(src, jsPlugin({ parser: 'acorn' }));
      const m = compile(src, jsPlugin({ parser: 'mini' }));
      expect(m.code).toBe(a.code);
      expect(m.explain).toBe(a.explain);
    });
  }
  it('rejects what it does not support, clearly', () => {
    expect(() => parseMini('let x = a?.b;')).toThrow(/optional chaining/);
    expect(() => parseMini('let x = `${a}`;')).toThrow(/template literals/);
  });
  it('handles precedence, associativity and ASI', () => {
    const p = parseMini('x = 2 ** 3 ** 2\ny = 1 - 2 - 3') as any;
    expect(p.body[0].expression.right.right.type).toBe('BinaryExpression');
    expect(p.body[1].expression.right.left.type).toBe('BinaryExpression');
  });
});
