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
let source: string;
try {
  source = readFileSync(file, 'utf8');
} catch (e) {
  // Like clox and drip-rs: report and exit 74 (EX_IOERR), no stack trace.
  console.error(`Could not read "${file}": ${(e as Error).message}`);
  process.exit(74);
}
const result = args.includes('--vm')
  ? (await import('./vm/index.ts')).runVm(source)
  : run(source);
for (const l of result.stdout) process.stdout.write(l + '\n');
for (const l of result.stderr) process.stderr.write(l + '\n');
process.exit(result.exitCode);
