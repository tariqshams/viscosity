// Run a program in a fresh, isolated VM context, capturing console.log and
// any uncaught error. Used for differential testing (the book's chapter “Differential testing at scale”).
import vm from 'node:vm';
import { inspect } from 'node:util';

export interface RunOutcome { out: string[]; error: string | null }

export function runIsolated(code: string): RunOutcome {
  const out: string[] = [];
  const fmt = (args: unknown[]) => args.map((a) => (typeof a === 'string' ? a : inspect(a))).join(' ');
  const context = vm.createContext({ console: { log: (...a: unknown[]) => out.push(fmt(a)) } });
  // vm.Script runs scripts, not modules: drop `export` keywords in both
  // versions (the semantics we test don't depend on them).
  const script = code.replace(/^export (default )?/gm, '');
  try {
    new vm.Script(script).runInContext(context, { timeout: 20000 });
    return { out, error: null };
  } catch (e) {
    const err = e as Error;
    return { out, error: `${err?.constructor?.name ?? 'Error'}: ${err?.message ?? String(e)}` };
  }
}
