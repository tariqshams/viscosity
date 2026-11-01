#!/usr/bin/env node
// viscosity: an automatic data-layout optimizer for JavaScript and TypeScript.
import { mkdirSync, readFileSync, realpathSync, statSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { basename, extname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { compile, explain, type PlanOptions } from '../../core/src/index.ts';
import { jsPlugin } from '../../frontend-js/src/index.ts';
import { pythonPlugin } from '../../frontend-python/src/index.ts';
import { profile, readProfile } from './profile.ts';

class UsageError extends Error {}

export const HELP = `viscosity: rewrites arrays of objects (JavaScript, TypeScript, Python) into struct-of-arrays layouts
when it can prove it is safe and expects it to be faster.

Usage:
  viscosity build <file> [-o out.js] [options]   compile a file
  viscosity build <file>... -o <dir> [options]   compile several files into dir/
  viscosity explain <file>... [options]          show every decision and why
  viscosity profile <file> [-o profile.json]     run the program and record collection sizes
  viscosity --help | --version

Options:
  -o, --out <path>          build: the output file, or a directory (several
                            files, or a path ending in /) that gets one file
                            per input, named after it
  --frames                  explain: under each refusal, show the source line
                            with carets under the code it is about
  --jobs <n>                compile up to n files at once (default: one per
                            CPU in the Rust CLI; this CLI compiles one at a
                            time)
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
  const args = { cmd: argv[0], files: [] as string[], out: '', explain: false, frames: false, jobs: 0, opts: {} as Partial<PlanOptions>, parser: 'acorn' as 'acorn' | 'mini', profile: '' };
  for (let i = 1; i < argv.length; i++) {
    const a = argv[i];
    const next = () => {
      const v = argv[++i];
      if (v === undefined) throw new UsageError(`${a} needs a value`);
      return v;
    };
    if (a === '-o' || a === '--out') args.out = next();
    else if (a === '--explain') args.explain = true;
    else if (a === '--frames') args.frames = true;
    else if (a === '--jobs' || a === '-j') {
      const v = Number(next());
      if (!Number.isInteger(v) || v < 1) throw new UsageError('--jobs must be a whole number of at least 1');
      args.jobs = v;
    }
    else if (a === '--mode') {
      const v = next();
      if (v !== 'auto' && v !== 'opt-in') throw new UsageError('--mode must be auto or opt-in');
      args.opts.mode = v;
    } else if (a === '--bounds') {
      const v = next();
      if (v !== 'check' && v !== 'assume') throw new UsageError('--bounds must be check or assume');
      args.opts.bounds = v;
    } else if (a === '--min-size') {
      const v = Number(next());
      if (Number.isNaN(v) || v < 0) throw new UsageError('--min-size must be a non-negative number');
      args.opts.minSize = v;
    } else if (a === '--profile') args.profile = next();
    else if (a === '--python-auto') args.opts.pythonAuto = true;
    else if (a === '--parser') {
      const v = next();
      if (v !== 'acorn' && v !== 'mini') throw new UsageError('--parser must be acorn or mini');
      args.parser = v;
    } else if (!a.startsWith('-')) args.files.push(a);
    else throw new UsageError(`unknown option ${a}`);
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
    if (a.files.length === 0) throw new UsageError('missing <file>');
    if (a.cmd !== 'build' && a.cmd !== 'explain' && a.cmd !== 'profile') throw new UsageError(`unknown command "${a.cmd}"`);
    if (a.cmd === 'profile') {
      if (a.files.length > 1) throw new UsageError('profile takes one file');
      const ext = extname(a.files[0]);
      if (ext === '.py') throw new Error('profile runs JavaScript programs only; Python profiling is not supported yet');
      const p = profile(a.files[0], pluginFor(a.files[0], a.parser));
      const text = JSON.stringify(p, null, 2) + '\n';
      if (a.out) writeFileSync(a.out, text);
      else process.stdout.write(text);
      return 0;
    }
    if (a.profile) a.opts.profile = readProfile(a.profile);
    const several = a.files.length > 1;
    // build: where each output goes ('' for stdout).
    let outs = a.files.map(() => a.out);
    if (a.cmd === 'build' && (several || a.out.endsWith('/') || isDir(a.out))) {
      if (!a.out) throw new UsageError('several files need an output directory: -o <dir>');
      outs = a.files.map((f) => join(a.out, outputName(f)));
      const seen = new Map<string, string>();
      for (const [k, o] of outs.entries()) {
        if (seen.has(o)) throw new UsageError(`${seen.get(o)} and ${a.files[k]} would both be written to ${o}`);
        seen.set(o, a.files[k]);
      }
      mkdirSync(a.out, { recursive: true });
    }
    // Files are independent; this CLI compiles them in order, one at a time.
    let failed = false;
    a.files.forEach((file, k) => {
      const tag = several ? `${file}: ` : '';
      let r, text;
      try {
        const src = readFileSync(file, 'utf8');
        r = compile(src, pluginFor(file, a.parser), a.opts);
        text = a.frames ? explain(r.plan, { frames: r.analysis.module.source }) : r.explain;
        if (a.cmd === 'build' && outs[k]) writeFileSync(outs[k], r.code);
      } catch (e) {
        if (!several) throw e;
        process.stderr.write(`viscosity: ${tag}${(e as Error).message}\n`);
        failed = true;
        return;
      }
      if (a.cmd === 'explain') {
        const body = (text || 'No arrays of objects found.') + '\n';
        process.stdout.write(several ? `${k > 0 ? '\n' : ''}== ${file} ==\n${body}` : body);
      } else {
        if (!outs[k]) process.stdout.write(r.code);
        if (a.explain) process.stderr.write(several ? `== ${file} ==\n${text}\n` : text + '\n');
      }
    });
    return failed ? 1 : 0;
  } catch (e) {
    // Usage text only helps when the command line itself was wrong.
    const usage = e instanceof UsageError;
    process.stderr.write(`viscosity: ${(e as Error).message}\n${usage ? `\n${HELP}` : ''}`);
    return 1;
  }
}

function pluginFor(file: string, parser: 'acorn' | 'mini') {
  const ext = extname(file);
  return ext === '.py' ? pythonPlugin() : jsPlugin({ parser, typescript: ['.ts', '.mts', '.tsx'].includes(ext) });
}

/** The name a compiled file gets in an output directory: its own, with
 *  TypeScript extensions replaced (the output is JavaScript). */
export function outputName(file: string): string {
  const b = basename(file);
  return b.replace(/\.(ts|mts|tsx)$/, (_m, x: string) => (x === 'mts' ? '.mjs' : x === 'tsx' ? '.jsx' : '.js'));
}

function isDir(p: string): boolean {
  try {
    return p !== '' && statSync(p).isDirectory();
  } catch {
    return false;
  }
}

// Run directly (node src/cli.ts ...). Compare real paths so symlinks work.
const self = process.argv[1] ? pathToFileURL(realpathSync(process.argv[1])).href : '';
if (import.meta.url === self) process.exit(main(process.argv.slice(2)));
