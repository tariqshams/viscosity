// Chapter 346 cards. Keys are stable ids: never rename them.

const PRE = `#[derive(Clone, Copy)]
enum Change {
    Break, // breaks the public API
    Feat,  // adds, breaks nothing
    Fix,   // fixes a bug
}
use Change::*;

// "1.4.2" -> (1, 4, 2)
fn parts(v: &str) -> (u64, u64, u64) {
    let n: Vec<u64> = v
        .split('.')
        .map(|p| p.parse().unwrap())
        .collect();
    (n[0], n[1], n[2])
}
`;

export const prompts = {
  'release-what': {
    q: 'What are the steps of a release process, in order?',
    a: 'Choose the version, record what changed (a changelog), build each package, check it as a user would get it, publish.',
  },
  'publish-permanent': {
    q: 'Why is publishing the step to be most careful with?',
    a: 'It can’t be undone: a crates.io version can never be overwritten or deleted, and an npm name and version can never be reused, even after unpublishing.',
  },
  'three-numbers': {
    q: 'Which three files hold the version numbers a Viscosity release would change?',
    a: '`engine/rust/Cargo.toml` (`[workspace.package]`, inherited by six crates), `engine/ts/packages/cli/package.json` and `engine/rust/packages/wasm/package.json`.',
  },
  'zero-y': {
    q: 'Under Cargo’s rules, what is the next version after 0.1.0 for a breaking change? For a new feature?',
    a: '0.2.0 for a breaking change (in 0.y.z, y counts as major). 0.1.1 for a feature (z counts as minor).',
  },
  'zero-zero': {
    q: 'Viscosity is at 0.0.1. Which later versions does Cargo’s caret requirement `"0.0.1"` accept, and why does that make 0.0.1 “experimental”?',
    a: 'None: it means `>=0.0.1, <0.0.2`. In 0.0.z the left-most non-zero part is z, so every patch release counts as incompatible, and users only move when they ask to.',
  },
  'api-surface': {
    q: 'Besides its functions, what counts as Viscosity’s public API?',
    a: 'The explain text, the CLI’s flags, messages and exit statuses, and the compiled code users run.',
  },
  'path-deps': {
    q: 'Why did `cargo package -p viscosity-core` fail at first?',
    a: 'Its dependency `viscosity-vir` was given by path only. crates.io needs a version requirement, so each internal dependency now has `version = "0.0.1"` next to its `path`.',
  },
  'crate-license': {
    q: 'What licence text did a packaged `viscosity-vir` crate first contain?',
    a: 'None: `crates/vir` had no LICENSE file, so the `.crate` held only the manifest, lockfile and sources. MIT asks for the notice to travel with copies, so each crate now has a LICENSE.',
  },
  'bundle-why': {
    q: 'Why does `@viscosity/cli` have no runtime dependencies?',
    a: 'esbuild bundles the CLI, the engine, acorn, acorn-walk and sucrase into one file, `dist/viscosity.mjs`; their licences go in THIRD_PARTY_LICENSES.txt.',
  },
  'scoped-access': {
    q: 'What does publishing a scoped npm package like `@viscosity/cli` for the first time need?',
    a: '`--access public` (scoped packages are not public by default; both packages set it in `publishConfig`), and the right to publish under the `@viscosity` organization scope.',
  },
  'ci-gap': {
    q: 'Name two release checks that CI does not run today.',
    a: 'Any two of: the `@viscosity/wasm` smoke test (`smoke.mjs`), wasm-bindgen, a long fuzzing campaign, the benchmarks.',
  },
  'who-publishes': {
    q: 'Who decides when Viscosity is published, and what does `scripts/release.sh` need before it will publish?',
    a: 'Tariq. Publishing is permanent and claims names, so the script stops without `NPM_TOKEN` and `CARGO_REGISTRY_TOKEN`, which he added after creating the npm organization `viscosity`.',
  },
};

export const exercises = {
  semver: {
    lang: 'rust',
    title: 'Cargo’s version arithmetic',
    prompt:
      'Write `next(v, c)`: the version after `v` for a change `c`. From 1.0.0 on, `Break` bumps the major number, `Feat` the minor and `Fix` the patch, and the parts to the right reset to 0. In `0.y.z`, `Break` bumps y and resets z, and `Feat` and `Fix` bump z. In `0.0.z`, every change bumps z. Then write `accepts(req, v)`: does Cargo’s default (caret) requirement `req` accept `v`? It must have the same left-most non-zero part (for `0.0.z`, the same everything) and not be older than `req`.',
    starter: `${PRE}
// The version after \`v\` for change \`c\`.
fn next(v: &str, c: Change) -> String {
    todo!()
}

// Does the requirement \`req\` (Cargo's
// default, a caret) accept version \`v\`?
fn accepts(req: &str, v: &str) -> bool {
    todo!()
}`,
    solution: `${PRE}
// The version after \`v\` for change \`c\`.
fn next(v: &str, c: Change) -> String {
    let (x, y, z) = parts(v);
    let (x, y, z) = match (x, y, c) {
        (0, 0, _) => (0, 0, z + 1),
        (0, _, Break) => (0, y + 1, 0),
        (0, _, _) => (0, y, z + 1),
        (_, _, Break) => (x + 1, 0, 0),
        (_, _, Feat) => (x, y + 1, 0),
        (_, _, Fix) => (x, y, z + 1),
    };
    format!("{x}.{y}.{z}")
}

// Does the requirement \`req\` (Cargo's
// default, a caret) accept version \`v\`?
fn accepts(req: &str, v: &str) -> bool {
    let a = parts(req);
    let b = parts(v);
    let (p, q, _) = b;
    let same = match a {
        (0, 0, _) => a == b,
        (0, y, _) => p == 0 && q == y,
        (x, _, _) => p == x,
    };
    same && b >= a
}`,
    tests: `#[test]
fn from_one_point_oh_on() {
    let v = "1.4.2";
    assert_eq!(next(v, Fix), "1.4.3");
    assert_eq!(next(v, Feat), "1.5.0");
    assert_eq!(next(v, Break), "2.0.0");
}

#[test]
fn zero_point_y() {
    let v = "0.1.0";
    assert_eq!(next(v, Break), "0.2.0");
    assert_eq!(next(v, Feat), "0.1.1");
    assert_eq!(next("0.1.7", Fix), "0.1.8");
}

#[test]
fn zero_zero_is_always_major() {
    for c in [Break, Feat, Fix] {
        // Viscosity today
        assert_eq!(next("0.0.1", c), "0.0.2");
        assert_eq!(next("0.0.3", c), "0.0.4");
    }
}

#[test]
fn caret_accepts_compatible() {
    assert!(accepts("0.1.0", "0.1.9"));
    assert!(!accepts("0.1.0", "0.2.0"));
    assert!(accepts("1.2.0", "1.9.0"));
    assert!(!accepts("1.2.0", "2.0.0"));
    assert!(!accepts("0.0.3", "0.0.4"));
    assert!(!accepts("0.0.1", "0.0.2"));
}

#[test]
fn never_an_older_version() {
    assert!(!accepts("0.1.5", "0.1.4"));
    assert!(!accepts("1.2.0", "1.1.9"));
}

#[test]
fn every_bump_is_judged_right() {
    for v in ["0.0.3", "0.1.4", "2.3.4"] {
        let b = next(v, Break);
        assert!(!accepts(v, &b), "{v}");
        let ok = !v.starts_with("0.0");
        for c in [Feat, Fix] {
            let n = next(v, c);
            assert_eq!(accepts(v, &n), ok);
        }
    }
}
`,
    hints: [
      'Match on a tuple, `match (x, y, c)`, with the most specific cases first: `(0, 0, _)`, then `(0, _, Break)`, then `(0, _, _)`, then the three 1.0-and-later cases.',
      'For `accepts`, decide “same series” with a `match` on `parts(req)`: `(0, 0, _)` needs all three equal, `(0, y, _)` needs major 0 and minor y, `(x, _, _)` needs major x.',
      'Tuples compare left to right, so `parts(v) >= parts(req)` says “not older”. Without it, `0.1.4` would satisfy a requirement of `0.1.5`.',
    ],
    walkthrough: `Cargo reads \`viscosity-core = "0.1"\` as \`>=0.1.0, <0.2.0\`: it accepts versions whose left-most non-zero part matches. Everything here follows from that one rule.

- **Why 0.y.z is special.** Semantic Versioning says that while the major number is 0, anything may change. Cargo turns that into something usable: in \`0.y.z\` it treats y as the major part, so \`0.1.0\` → \`0.2.0\` is a break and \`0.1.0\` → \`0.1.1\` is not. In \`0.0.z\` the left-most non-zero part is z, so every release is a break: Viscosity’s \`"0.0.1"\` means \`>=0.0.1, <0.0.2\`.
- **Why match on a tuple.** \`(x, y, c)\` puts all three facts in one place. The arms go from most to least specific, and \`match\` takes the first that fits, so \`(0, 0, _)\` must come before \`(0, _, Break)\`.
- **Why the parts reset.** \`1.4.2\` plus a feature is \`1.5.0\`, not \`1.5.2\`: the patch number counts fixes *since that minor release*.
- **Why \`b >= a\`.** A caret requirement is a range with a lower bound. \`"0.1.5"\` needs at least 0.1.5. Rust compares tuples element by element, which is exactly version order for numbers.
- **The last test** ties the two functions together: a \`Break\` must never be accepted by the old requirement, and \`Feat\` and \`Fix\` must be, except in \`0.0.z\`.`,
    wrong: [
      {
        code: `${PRE}
// The version after \`v\` for change \`c\`.
fn next(v: &str, c: Change) -> String {
    let (x, y, z) = parts(v);
    let (x, y, z) = match c {
        Break => (x + 1, 0, 0),
        Feat => (x, y + 1, 0),
        Fix => (x, y, z + 1),
    };
    format!("{x}.{y}.{z}")
}

// Does the requirement \`req\` (Cargo's
// default, a caret) accept version \`v\`?
fn accepts(req: &str, v: &str) -> bool {
    let a = parts(req);
    let b = parts(v);
    a.0 == b.0 && b >= a
}`,
        why: 'This applies the 1.0 rules to every version. For a crate at 0.1.0, a breaking change would become 1.0.0, and a feature 0.2.0, which Cargo users of `"0.1"` would never get.',
      },
      {
        code: `${PRE}
// The version after \`v\` for change \`c\`.
fn next(v: &str, c: Change) -> String {
    let (x, y, z) = parts(v);
    let (x, y, z) = match (x, y, c) {
        (0, 0, _) => (0, 0, z + 1),
        (0, _, Break) => (0, y + 1, 0),
        (0, _, _) => (0, y, z + 1),
        (_, _, Break) => (x + 1, y, z),
        (_, _, Feat) => (x, y + 1, z),
        (_, _, Fix) => (x, y, z + 1),
    };
    format!("{x}.{y}.{z}")
}

// Does the requirement \`req\` (Cargo's
// default, a caret) accept version \`v\`?
fn accepts(req: &str, v: &str) -> bool {
    let a = parts(req);
    let b = parts(v);
    let (p, q, _) = b;
    let same = match a {
        (0, 0, _) => a == b,
        (0, y, _) => p == 0 && q == y,
        (x, _, _) => p == x,
    };
    same && b >= a
}`,
        why: 'The 0.y.z cases are right, but from 1.0 on the lower parts don’t reset: 1.4.2 plus a feature gives 1.5.2.',
      },
      {
        code: `${PRE}
// The version after \`v\` for change \`c\`.
fn next(v: &str, c: Change) -> String {
    let (x, y, z) = parts(v);
    let (x, y, z) = match (x, y, c) {
        (0, 0, _) => (0, 0, z + 1),
        (0, _, Break) => (0, y + 1, 0),
        (0, _, _) => (0, y, z + 1),
        (_, _, Break) => (x + 1, 0, 0),
        (_, _, Feat) => (x, y + 1, 0),
        (_, _, Fix) => (x, y, z + 1),
    };
    format!("{x}.{y}.{z}")
}

// Does the requirement \`req\` (Cargo's
// default, a caret) accept version \`v\`?
fn accepts(req: &str, v: &str) -> bool {
    let a = parts(req);
    let b = parts(v);
    let (p, q, _) = b;
    match a {
        (0, 0, _) => a == b,
        (0, y, _) => p == 0 && q == y,
        (x, _, _) => p == x,
    }
}`,
        why: '`accepts` checks the series but not the lower bound, so `0.1.4` satisfies a requirement of `0.1.5`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Suppose Viscosity were at 0.1.0 and a release changed the wording of an explain line. Under Cargo’s rules, what should the version be?',
    options: [
      { t: '0.1.1: it is only text', why: 'Explain text is part of the API: tests and users compare it exactly. A change that can break them is a breaking change.' },
      { t: '0.2.0', correct: true, why: 'In 0.y.z Cargo treats y as the major part, so a breaking change bumps y and resets z.' },
      { t: '1.0.0', why: 'That would be the 1.0 rule. Going to 1.0 is a choice to promise stability, not what a break in 0.y.z requires.' },
    ],
  },
  {
    q: 'Before the first crates.io release, what did `cargo package -p viscosity-core` do in the repository?',
    options: [
      { t: 'Built a `.crate` file and verified it, ready to upload', why: 'Not on its own: the verifying build looked for `viscosity-vir` on crates.io, where it wasn’t yet.' },
      { t: 'Uploaded the crate to crates.io', why: '`cargo package` never uploads. That is `cargo publish`.' },
      { t: 'Stopped: `viscosity-vir` was a path dependency without a version', why: 'That was the very first result. crates.io needs a version requirement, and the workspace now gives one.' },
      { t: 'Packed it, then failed to verify it: `viscosity-vir` wasn’t on crates.io yet', correct: true, why: 'The verifying build resolves dependencies from crates.io. `cargo package --workspace` packs `viscosity-vir` first and verifies against that instead.' },
    ],
  },
  {
    q: 'Why does `@viscosity/cli` ship a THIRD_PARTY_LICENSES.txt?',
    options: [
      { t: 'npm refuses packages without one', why: 'npm doesn’t require it. The licences of the bundled code do.' },
      { t: 'Its bundle contains acorn, acorn-walk and sucrase, whose MIT licences require their notices to travel with the code', correct: true, why: 'Bundling copies their code into `dist/viscosity.mjs`, so their notices go with it.' },
      { t: 'It lists the 71 Rust crates in the engine', why: 'That is `@viscosity/wasm`. The CLI package is the TypeScript engine.' },
    ],
  },
  {
    q: 'Which of these does CI run on every push?',
    options: [
      { t: 'Pack `@viscosity/cli`, install it in an empty folder and run it', correct: true, why: 'The TypeScript job does this, and checks `--version` against package.json.' },
      { t: 'The `@viscosity/wasm` smoke test', why: '`smoke.mjs` exists but is run by hand. CI only builds the crate for wasm32, in debug.' },
      { t: 'A 20,000-program fuzzing campaign', why: 'CI runs the fixed-seed fuzz test inside `cargo test`; long campaigns are run by hand.' },
      { t: '`npm publish --dry-run`', why: 'Not there. It packs the CLI, but doesn’t try a publish; `scripts/release.sh --dry-run` does, by hand.' },
    ],
  },
  {
    q: 'A user depends on `viscosity-core = "0.1"`. Which release will `cargo update` give them?',
    options: [
      { t: '0.2.0', why: 'Outside the range: `"0.1"` means `>=0.1.0, <0.2.0`.' },
      { t: '1.0.0', why: 'Also outside the range.' },
      { t: '0.1.3', correct: true, why: 'Same left-most non-zero part (the 1), and not older than 0.1.0.' },
    ],
  },
  {
    q: '`scripts/release.sh` can publish everything. Why does it only do so with tokens Tariq adds himself?',
    options: [
      { t: 'Because npm can’t publish scoped packages without them', why: 'Scoped packages publish fine with `publishConfig.access` set to public. The tokens say who is publishing.' },
      { t: 'Because the packages don’t build without them', why: 'Both npm packages build and pack, and `--dry-run` verifies all six crates, with no tokens at all.' },
      { t: 'Because publishing is permanent, and whether and when to do it is the author’s decision', correct: true, why: 'A published version can’t be taken back. The script does the work; the tokens keep running it a deliberate human step.' },
    ],
  },
];
