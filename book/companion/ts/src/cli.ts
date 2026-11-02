#!/usr/bin/env node
// drip [--vm] script.drip
// Exit codes: 0 success, 65 compile error, 70 runtime error,
// 66 the file cannot be read, 64 usage error.
import { readFileSync } from 'node:fs';
import { run } from './drip.ts';

const args = process.argv.slice(2);
const files = args.filter((a) => !a.startsWith('--'));
if (files.length !== 1) {
  console.error('usage: drip [--vm] <file>');
  process.exit(64);
}
const file = files[0];
let source: string;
try {
  source = readFileSync(file, 'utf8');
} catch (e) {
  console.error(`cannot read ${file}: ${(e as NodeJS.ErrnoException).code ?? (e as Error).message}`);
  process.exit(66);
}
const result = args.includes('--vm')
  ? (await import('./vm/index.ts')).runVm(source)
  : run(source);
for (const l of result.stdout) process.stdout.write(l + '\n');
for (const l of result.stderr) process.stderr.write(l + '\n');
process.exit(result.exitCode);
