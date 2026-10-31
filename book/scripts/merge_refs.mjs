// Merges verified references from src/data/refs-new/<chapter>.js into the
// main bibliography (src/data/references.js), then removes the merged files.
// Usage: node scripts/merge_refs.mjs 001-functions 002-arrays ...  (or --all)
import { readdirSync, readFileSync, writeFileSync, unlinkSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir = join(root, 'src/data/refs-new');
const target = join(root, 'src/data/references.js');
const { references } = await import(pathToFileURL(target).href);
const have = new Map(references.map((r) => [r.id, r]));
const args = process.argv.slice(2);
const files = (args[0] === '--all' ? readdirSync(dir).filter((f) => f.endsWith('.js')) : args.map((a) => `${a}.js`))
  .filter((f) => existsSync(join(dir, f)));
const added = [];
for (const f of files) {
  const { default: refs } = await import(pathToFileURL(join(dir, f)).href);
  for (const r of refs) {
    if (have.has(r.id)) {
      const old = have.get(r.id);
      if (old.url !== r.url) console.warn(`warning: ${f} redefines ${r.id} with a different URL; keeping the first`);
      continue;
    }
    have.set(r.id, r);
    added.push(r);
  }
}
if (added.length) {
  let src = readFileSync(target, 'utf8');
  const marker = '\n];\n\n// Not yet confirmed';
  const at = src.indexOf(marker);
  if (at < 0) throw new Error('cannot find the end of the references array');
  const body = added.map((r) => '  ' + JSON.stringify(r, null, 2).replace(/\n/g, '\n  ') + ',').join('\n');
  src = src.slice(0, at) + '\n' + body + src.slice(at);
  writeFileSync(target, src);
}
for (const f of files) unlinkSync(join(dir, f));
console.log(`merged ${added.length} new references from ${files.length} files`);
