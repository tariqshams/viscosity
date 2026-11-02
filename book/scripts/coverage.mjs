// Render src/data/coverage.js as COVERAGE.md: each chapter of the standard
// compiler texts, and the chapters of this book that teach it.
//   node scripts/coverage.mjs
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BOOKS, COVERAGE } from '../src/data/coverage.js';
import { CONCEPTS } from '../src/data/concepts.js';
import { OUTLINE } from '../src/data/outline/index.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const title = (n) => OUTLINE.find((c) => c.n === n)?.title ?? '?';
let md = `# Coverage: the standard texts, chapter by chapter

Generated from \`src/data/coverage.js\` by \`scripts/coverage.mjs\`; do not edit by hand.

The aim is that a reader of this book never needs another compiler
textbook. Each row is one chapter of a standard text, and the chapters of
this book that teach what it covers. \`scripts/check_chapters.mjs\` fails if
a row names a concept no chapter introduces.
`;
for (const [id, name] of Object.entries(BOOKS)) {
  md += `\n## ${name}\n\n| Chapter | Title | Taught in |\n|---|---|---|\n`;
  for (const [book, ch, t, concepts] of COVERAGE.filter((r) => r[0] === id)) {
    const ns = [...new Set(concepts.map((c) => CONCEPTS[c]?.n).filter(Boolean))].sort((a, b) => a - b);
    md += `| ${ch} | ${t} | ${ns.map((n) => `${n}. ${title(n)}`).join('; ')} |\n`;
  }
}
writeFileSync(join(root, 'COVERAGE.md'), md);
console.log(`COVERAGE.md: ${COVERAGE.length} rows`);
