// Runs a program in a fresh, isolated VM context, capturing console.log and
// any uncaught error, and prints the outcome as JSON. A copy of
// engine/ts/packages/frontend-js/test/run.ts for the Rust differential test.
const vm = require('node:vm');
const { inspect } = require('node:util');
const { readFileSync } = require('node:fs');

const code = readFileSync(process.argv[2], 'utf8');
const out = [];
const fmt = (args) => args.map((a) => (typeof a === 'string' ? a : inspect(a))).join(' ');
const context = vm.createContext({ console: { log: (...a) => out.push(fmt(a)) } });
// vm.Script runs scripts, not modules: drop `export` keywords.
const script = code.replace(/^export (default )?/gm, '');
let error = null;
try {
  new vm.Script(script).runInContext(context, { timeout: 20000 });
} catch (e) {
  error = `${e?.constructor?.name ?? 'Error'}: ${e?.message ?? String(e)}`;
}
process.stdout.write(JSON.stringify({ out, error }));
