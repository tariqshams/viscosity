// Imports the Crafting Interpreters test suite (Robert Nystrom, MIT licence)
// as Drip tests. Drip is a dialect of Lox: `fun` is spelled `fn` and `var`
// is spelled `let`. Rewrites happen only in code (never inside strings), and
// in error expectations that quote a keyword. Identifiers named `fn` or
// `let` (legal in Lox) are renamed to `func` / `let_`.
//
// Usage: node scripts/import_lox_tests.mjs <path-to-craftinginterpreters/test>
import { readdirSync, readFileSync, writeFileSync, mkdirSync, statSync, copyFileSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const src = process.argv[2];
if (!src) throw new Error('pass the path to craftinginterpreters/test');
const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, '..', '..', 'corpus');

function rewriteCode(code) {
  return code
    .replace(/\bfn\b/g, 'func')
    .replace(/\blet\b/g, 'let_')
    .replace(/\bfun\b/g, 'fn')
    .replace(/\bvar\b/g, 'let');
}

function rewriteComment(c) {
  return c
    .replace(/'fun'/g, "'fn'").replace(/'var'/g, "'let'")
    // scanning tests print TOKEN_TYPE lexeme literal
    .replace(/expect: FUN fun null/, 'expect: FN fn null')
    .replace(/expect: VAR var null/, 'expect: LET let null');
}

export function convert(text) {
  let res = '';
  let inString = false;
  let i = 0;
  let code = '';
  const flush = () => { res += rewriteCode(code); code = ''; };
  while (i < text.length) {
    const c = text[i];
    if (inString) {
      res += c;
      if (c === '"') inString = false;
      i++;
    } else if (c === '"') {
      flush();
      res += c;
      inString = true;
      i++;
    } else if (c === '/' && text[i + 1] === '/') {
      flush();
      let j = text.indexOf('\n', i);
      if (j < 0) j = text.length;
      res += rewriteComment(text.slice(i, j));
      i = j;
    } else {
      code += c;
      i++;
    }
  }
  flush();
  return res;
}

let n = 0;
(function walk(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (f.endsWith('.lox')) {
      const rel = relative(src, p).replace(/\.lox$/, '.drip');
      const target = join(out, rel);
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, convert(readFileSync(p, 'utf8')));
      n++;
    }
  }
})(src);
copyFileSync(join(src, '..', 'LICENSE'), join(out, 'LICENSE-craftinginterpreters'));
writeFileSync(join(out, 'README.md'), `# The Drip test corpus

${n} test programs adapted from the test suite of *Crafting Interpreters* by
Robert Nystrom (https://github.com/munificent/craftinginterpreters). The
\`.lox\` test files are MIT-licensed (see LICENSE-craftinginterpreters, which
also covers this adaptation): "Copyright (c) 2015 Robert Nystrom".

The only changes: Drip spells \`fun\` as \`fn\` and \`var\` as \`let\`, and
identifiers that would clash with those keywords are renamed. Expectations are
written in comments: \`// expect: <output>\`, \`// expect runtime error: <msg>\`
and \`// [line N] Error ...\` / \`// Error ...\` for static errors.
Regenerate with \`npm run corpus:import\` in book/companion/ts.
`);
console.log(`imported ${n} tests into ${out}`);
