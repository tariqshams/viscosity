#!/usr/bin/env node
// viscosity: an automatic data-layout optimizer for JavaScript and TypeScript.
import { readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { extname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { compile, type PlanOptions } from '../../core/src/index.ts';
import { jsPlugin } from '../../frontend-js/src/index.ts';
import { pythonPlugin } from '../../frontend-python/src/index.ts';
import { profile } from './profile.ts';

export const HELP = `viscosity: rewrites arrays of objects (JavaScript, TypeScript, Python) into struct-of-arrays layouts
when it can prove it is safe and expects it to be faster.

Usage:
  viscosity build <file> [-o out.js] [options]   compile a file
  viscosity explain <file> [options]             show every decision and why
  viscosity profile <file> [-o profile.json]     run the program and record collection sizes
  viscosity --help | --version

Options:
  --mode auto|opt-in        auto (default) decides everything; opt-in only
                            transforms collections marked // @viscosity soa
  --bounds check|assume     check (default) keeps out-of-bounds behaviour
                            identical; assume trusts the program
  --min-size <n>            leave collections smaller than n alone (default 64)
  --profile <profile.json>  use measured sizes from \`viscosity profile\`
  --parser acorn|mini       JavaScript parser (default acorn)
  --explain                 also print the explanation when building
  --python-auto             Python: transform without annotations (CPython
                            column access is slower; the gain is memory)
`;

export function parseArgs(argv: string[]) {
  const args = { cmd: argv[0], file: '', out: '', explain: false, opts: {} as Partial<PlanOptions>, parser: 'acorn' as 'acorn' | 'mini', profile: '' };
  for (let i = 1; i < argv.length; i++) {
    const a = argv[i];
    const next = () => {
      const v = argv[++i];
      if (v === undefined) throw new Error(`${a} needs a value`);
      return v;
    };
    if (a === '-o' || a === '--out') args.out = next();
    else if (a === '--explain') args.explain = true;
    else if (a === '--mode') {
      const v = next();
      if (v !== 'auto' && v !== 'opt-in') throw new Error('--mode must be auto or opt-in');
      args.opts.mode = v;
    } else if (a === '--bounds') {
      const v = next();
      if (v !== 'check' && v !== 'assume') throw new Error('--bounds must be check or assume');
      args.opts.bounds = v;
    } else if (a === '--min-size') args.opts.minSize = Number(next());
    else if (a === '--profile') args.profile = next();
    else if (a === '--python-auto') args.opts.pythonAuto = true;
    else if (a === '--parser') {
      const v = next();
      if (v !== 'acorn' && v !== 'mini') throw new Error('--parser must be acorn or mini');
      args.parser = v;
    } else if (!a.startsWith('-') && !args.file) args.file = a;
    else throw new Error(`unknown option ${a}`);
  }
  return args;
}

export function main(argv: string[]): number {
  if (argv.length === 0 || argv[0] === '--help' || argv[0] === '-h') {
    process.stdout.write(HELP);
    return 0;
  }
  if (argv[0] === '--version') {
    // package.json sits one level up from both src/cli.ts and dist/viscosity.mjs.
    const { version } = createRequire(import.meta.url)('../package.json') as { version: string };
    process.stdout.write(`viscosity ${version}\n`);
    return 0;
  }
  try {
    const a = parseArgs(argv);
    if (!a.file) throw new Error('missing <file>');
    const ext = extname(a.file);
    const plugin = ext === '.py' ? pythonPlugin() : jsPlugin({ parser: a.parser, typescript: ['.ts', '.mts', '.tsx'].includes(ext) });
    if (a.cmd === 'profile') {
      if (ext === '.py') throw new Error('profile runs JavaScript programs only; Python profiling is not supported yet');
      const p = profile(a.file, plugin);
      const text = JSON.stringify(p, null, 2) + '\n';
      if (a.out) writeFileSync(a.out, text);
      else process.stdout.write(text);
      return 0;
    }
    if (a.profile) a.opts.profile = JSON.parse(readFileSync(a.profile, 'utf8'));
    const src = readFileSync(a.file, 'utf8');
    const r = compile(src, plugin, a.opts);
    if (a.cmd === 'explain') {
      process.stdout.write((r.explain || 'No arrays of objects found.') + '\n');
      return 0;
    }
    if (a.cmd === 'build') {
      if (a.out) writeFileSync(a.out, r.code);
      else process.stdout.write(r.code);
      if (a.explain) process.stderr.write(r.explain + '\n');
      return 0;
    }
    throw new Error(`unknown command "${a.cmd}"`);
  } catch (e) {
    process.stderr.write(`viscosity: ${(e as Error).message}\n\n${HELP}`);
    return 1;
  }
}

// Run directly (node src/cli.ts ...). Compare real paths so symlinks work.
const self = process.argv[1] ? pathToFileURL(realpathSync(process.argv[1])).href : '';
if (import.meta.url === self) process.exit(main(process.argv.slice(2)));
