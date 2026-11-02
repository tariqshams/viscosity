// Retitle chapters (and rename their folders) so no title echoes another
// book's chapter titles. Keyed by the chapter's current folder slug, so it
// still applies after renumbering. Applied once by:
//   node scripts/expansion/retitle.mjs [--dry-run]
// It updates the outline title, the frontmatter title, the folder name (and
// links to it), and adds a redirect from the old URL if that URL was live.
import { readdirSync, readFileSync, writeFileSync, renameSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const RETITLE = {
  'map-of-the-territory': ['From source text to a running program', 'from-source-to-running-program'],
  'evaluating-expressions': ['Running expressions: a tree that computes', 'running-expressions'],
  'statements-and-state': ['Doing things in order: statements and variables', 'statements-and-variables'],
  'control-flow': ['Choosing and repeating: if, while and for', 'choosing-and-repeating'],
  'resolving-variables': ['Finding every name before running: the resolver', 'the-resolver'],
  'classes-and-instances-in-drip': ['Records with behaviour: classes in Drip', 'classes-in-drip'],
  'chunks-and-a-disassembler': ['Bytecode as data, and reading it back', 'bytecode-as-data'],
  'a-stack-based-vm': ['A machine with a stack', 'a-machine-with-a-stack'],
  'compiling-expressions': ['One pass from source to bytecode', 'one-pass-to-bytecode'],
  'representing-values': ['Tagging values at run time', 'tagging-values'],
  'strings-and-heap-objects': ['Objects that live on the heap', 'objects-on-the-heap'],
  'hash-tables': ['Finding things fast: hash tables', 'finding-things-fast'],
  'global-variables-in-the-vm': ['Globals by name', 'globals-by-name'],
  'local-variables-and-stack-slots': ['Locals as stack slots', 'locals-as-stack-slots'],
  'jumps-if-while-and-for': ['Branches and loops in bytecode', 'branches-and-loops-in-bytecode'],
  'calls-and-call-frames': ['Frames: calling and returning in the VM', 'frames-calling-and-returning'],
  'closures-and-upvalues': ['Capturing variables: upvalues', 'capturing-variables'],
  'garbage-collection-mark-and-sweep': ['Reclaiming memory: mark and sweep', 'reclaiming-memory'],
  'classes-and-methods-in-the-vm': ['Objects and method calls in the VM', 'objects-and-method-calls'],
  'making-the-vm-fast': ['Measuring and speeding up the VM', 'speeding-up-the-vm'],
  'chunks-and-opcodes-in-rust': ['Bytecode and instructions in Rust', 'bytecode-in-rust'],
  'globals-and-locals-in-rust': ['Globals by name and locals by slot, in Rust', 'variables-in-rust'],
  'control-flow-in-rust': ['Branches and loops in Rust', 'branches-and-loops-in-rust'],
  'closures-and-upvalues-in-rust': ['Capturing variables in Rust', 'capturing-variables-in-rust'],
  'classes-and-instances-in-rust': ['Objects in Rust', 'objects-in-rust'],
  'methods-and-initializers-in-rust': ['Method calls and init in Rust', 'method-calls-in-rust'],
  'inheritance-in-rust': ['extends and super in Rust', 'extends-and-super-in-rust'],
};

/** Part titles that echo another book's part titles. */
export const PART_RETITLE = {
  'A tree-walking interpreter': 'Front ends: building Drip, and the theory behind it',
  'A bytecode virtual machine': 'Drip, compiled: a virtual machine of our own',
};

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
  const repo = join(root, '..');
  const dry = process.argv.includes('--dry-run');
  const chapters = join(root, 'src/content/chapters');
  const diagrams = join(root, 'src/components/diagrams');
  const outlineDir = join(root, 'src/data/outline');
  const q = (s) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
  const { PUBLISHED } = await import(pathToFileURL(join(root, 'src/data/published.js')).href);
  const { REDIRECTS } = await import(pathToFileURL(join(root, 'src/data/redirects.js')).href);
  const published = new Set(PUBLISHED);
  const moves = [];
  for (const f of readdirSync(chapters)) {
    const slug = f.slice(4);
    if (!RETITLE[slug]) continue;
    const [title, newSlug] = RETITLE[slug];
    const n = Number(f.slice(0, 3));
    const to = `${f.slice(0, 3)}-${newSlug}`;
    moves.push([f, to]);
    console.log(`${f} -> ${to}: "${title}"`);
    if (dry) continue;
    const mdx = join(chapters, f, 'index.mdx');
    writeFileSync(mdx, readFileSync(mdx, 'utf8').replace(/^title: .*$/m, `title: ${q(title)}`));
    for (const o of readdirSync(outlineDir).filter((x) => /^part\d+\.js$/.test(x))) {
      const p = join(outlineDir, o);
      const s = readFileSync(p, 'utf8');
      const t = s.replace(new RegExp(`(\\{ n: ${n}, title: )'(?:[^'\\\\]|\\\\.)*'`), `$1${q(title)}`);
      if (t !== s) writeFileSync(p, t);
    }
    renameSync(join(chapters, f), join(chapters, to));
  }
  if (!dry) {
    for (const o of readdirSync(outlineDir).filter((x) => /^part\d+\.js$/.test(x))) {
      const p = join(outlineDir, o);
      let s = readFileSync(p, 'utf8');
      for (const [a, b] of Object.entries(PART_RETITLE)) s = s.replace(`title: ${q(a)}`, `title: ${q(b)}`);
      writeFileSync(p, s);
    }
    // Links to the old folders, anywhere in the book and docs.
    const walk = (d, out = []) => {
      if (!existsSync(d)) return out;
      for (const e of readdirSync(d, { withFileTypes: true })) {
        if (['node_modules', 'dist', '.astro'].includes(e.name)) continue;
        const p = join(d, e.name);
        if (e.isDirectory()) walk(p, out);
        else if (/\.(mdx?|js|mjs|ts|tsx|astro)$/.test(e.name)) out.push(p);
      }
      return out;
    };
    for (const p of [...walk(join(root, 'src')), ...walk(join(repo, 'website/src/content'))]) {
      if (p.endsWith('redirects.js') || p.endsWith('published.js')) continue;
      const s = readFileSync(p, 'utf8');
      let t = s;
      for (const [a, b] of moves) t = t.replaceAll(`chapters/${a}/`, `chapters/${b}/`);
      if (t !== s) writeFileSync(p, t);
    }
    const redirects = Object.fromEntries(Object.entries(REDIRECTS).map(([k, v]) => {
      for (const [a, b] of moves) if (v === `/chapters/${a}/`) return [k, `/chapters/${b}/`];
      return [k, v];
    }));
    for (const [a, b] of moves) if (published.has(a)) redirects[`/chapters/${a}/`] = `/chapters/${b}/`;
    const red = join(root, 'src/data/redirects.js');
    const head = readFileSync(red, 'utf8').split('export const')[0];
    writeFileSync(red, `${head}export const REDIRECTS = ${JSON.stringify(redirects, null, 2)};\n`);
  }
  void diagrams;
  console.log(`${moves.length} chapters retitled${dry ? ' (dry run)' : ''}`);
}
