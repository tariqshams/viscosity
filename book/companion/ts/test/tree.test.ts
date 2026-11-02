import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CORPUS, check, isBenchmark, listTests } from './corpus.ts';
import { run } from '../src/drip.ts';

describe('the tree-walking interpreter passes the Drip corpus', () => {
  for (const t of listTests()) {
    if (isBenchmark(t)) continue;
    it(t, () => {
      const src = readFileSync(join(CORPUS, t), 'utf8');
      expect(check(src, run(src))).toEqual([]);
    });
  }
});
