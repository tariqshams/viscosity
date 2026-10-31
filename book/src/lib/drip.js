// Running Drip programs in the browser runner and in the chapter checker.
// The interpreter and VM are the book's companion code (companion/ts).

export async function runDrip(source, lang = 'drip') {
  if (lang === 'drip-vm') {
    const { runVm } = await import('../../companion/ts/src/vm/index.ts');
    return runVm(source);
  }
  const { run } = await import('../../companion/ts/src/drip.ts');
  return run(source);
}

/** A Drip exercise passes when its output matches `expected` exactly. */
export function checkDripOutput(result, expected) {
  const want = expected.replace(/\n$/, '').split('\n');
  const got = result.stdout.flatMap((l) => l.split('\n'));
  const results = [];
  if (result.exitCode !== 0) {
    results.push({ name: 'the program runs without errors', ok: false, message: result.stderr.join(' ') });
  }
  const ok = want.length === got.length && want.every((w, i) => w === got[i]);
  results.push({
    name: 'the output is exactly right',
    ok,
    message: ok ? undefined : `expected:\n${want.join('\n')}\ngot:\n${got.join('\n')}`,
  });
  return results;
}
