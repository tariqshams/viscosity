import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CORPUS, check, listTests, shouldSkip } from './corpus.ts';
import { run } from '../src/drip.ts';

describe('tree-walking interpreter passes the Drip corpus (jlox expectations)', () => {
  for (const t of listTests()) {
    if (shouldSkip(t, 'tree')) continue;
    it(t, () => {
      const src = readFileSync(join(CORPUS, t), 'utf8');
      expect(check(t, src, run(src), 'java')).toEqual([]);
    });
  }
});
