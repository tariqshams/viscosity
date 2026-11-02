// Running Rust in the book. Browsers can't compile Rust, so code goes to the
// official Rust Playground (play.rust-lang.org), which compiles and runs it
// and sends back stdout/stderr. If that can't be reached, the runner offers a
// link that opens the same code in the Playground. The chapter checker
// compiles every Rust example and exercise locally with rustc instead.

export const PLAYGROUND = 'https://play.rust-lang.org';

export function playgroundLink(code) {
  return `${PLAYGROUND}/?version=stable&mode=debug&edition=2021&code=${encodeURIComponent(code)}`;
}

/** Put the reader's code and the exercise's tests into one test crate. */
export function testCrate(code, tests) {
  // Tests are not re-indented: that would change multi-line string literals.
  return `${code}\n\n#[cfg(test)]\nmod tests {\n    use super::*;\n\n${tests}\n}\n`;
}

/** Parse `cargo test` output into per-test results. */
export function parseTestOutput(text) {
  const results = [];
  for (const m of text.matchAll(/^test (?:tests::)?(\S+)(?: - should panic)? \.\.\. (ok|FAILED)$/gm)) {
    results.push({ name: m[1].replace(/_/g, ' '), ok: m[2] === 'ok' });
  }
  const failures = [...text.matchAll(/---- (?:tests::)?(\S+) stdout ----\n([\s\S]*?)(?=\n\n----|\nfailures:|$)/g)];
  for (const f of failures) {
    const r = results.find((x) => x.name === f[1].replace(/_/g, ' '));
    if (r) r.message = f[2].replace(/thread '[^']*'(?: \(\d+\))? panicked at [^\n]*\n/, '').trim().split('\n')[0];
  }
  return results;
}

export async function runRustInPlayground(code, tests) {
  const body = {
    channel: 'stable', mode: 'debug', edition: '2021', backtrace: false,
    crateType: tests ? 'lib' : 'bin', tests: !!tests,
    code: tests ? testCrate(code, tests) : code,
  };
  const res = await fetch(`${PLAYGROUND}/execute`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Rust Playground returned ${res.status}`);
  const j = await res.json();
  return { success: !!j.success, stdout: j.stdout ?? '', stderr: j.stderr ?? '' };
}
