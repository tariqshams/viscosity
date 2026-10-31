#!/usr/bin/env node
// drip [--vm] script.drip
import { readFileSync } from 'node:fs';
import { run } from './drip.ts';

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith('--'));
if (!file) {
  console.error('Usage: drip [--vm] script.drip');
  process.exit(64);
}
const source = readFileSync(file, 'utf8');
const result = args.includes('--vm')
  ? (await import('./vm/index.ts')).runVm(source)
  : run(source);
for (const l of result.stdout) process.stdout.write(l + '\n');
for (const l of result.stderr) process.stderr.write(l + '\n');
process.exit(result.exitCode);
