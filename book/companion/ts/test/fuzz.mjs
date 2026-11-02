// node test/fuzz.mjs [count]: mangle corpus programs (drop, replace or
// insert a token) and check that the tree-walker's parser and resolver
// and the VM's single-pass compiler report exactly the same compile
// errors. (Mangled programs are not run: one could loop forever.)
// SEED=n picks a different set of mangled programs.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
const { listTests, CORPUS } = await import('./corpus.ts');
const { scan } = await import('../src/scanner.ts');
const { parse } = await import('../src/parser.ts');
const { resolve } = await import('../src/resolver.ts');
const { makeReporter } = await import('../src/errors.ts');
const { compile, Heap } = await import('../src/vm/index.ts');

function treeErrors(src) {
  const reporter = makeReporter();
  const program = parse(scan(src), reporter);
  if (!reporter.errors.length) resolve(program, reporter);
  return reporter.errors;
}
function vmErrors(src) {
  const errors = [];
  compile(src, new Heap(), errors);
  return errors;
}

const count = Number(process.argv[2] ?? 2000);
let seed = Number(process.env.SEED ?? 12345);
const rand = (n) => {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed % n;
};
const tests = listTests();
const pieces = ['(', ')', '{', '}', '[', ']', ';', ',', '.', '..', '=', '+=', '!', 'fn', 'let', 'if', 'else', 'for', 'in',
  'while', 'class', 'extends', 'new', 'self', 'super', 'return', 'break', 'continue', 'print', 'x', '1', '"s"', 'init', '#'];
let failures = 0;
for (let i = 0; i < count; i++) {
  const src = readFileSync(join(CORPUS, tests[rand(tests.length)]), 'utf8');
  const words = src.split(/(\s+)/);
  const k = rand(words.length);
  const op = rand(3);
  if (op === 0) words[k] = '';
  else if (op === 1) words[k] = pieces[rand(pieces.length)];
  else words.splice(k, 0, ' ' + pieces[rand(pieces.length)] + ' ');
  const mangled = words.join('');
  const a = treeErrors(mangled);
  const b = vmErrors(mangled);
  if (JSON.stringify(a) !== JSON.stringify(b)) {
    failures++;
    if (failures <= 5) console.log(`---- mismatch ----\n${mangled}\n-- tree: ${JSON.stringify(a)}\n-- vm:   ${JSON.stringify(b)}`);
  }
}
console.log(`${count} mangled programs, ${failures} disagreements`);
process.exit(failures ? 1 : 0);
