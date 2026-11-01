# @viscosity/wasm

The Viscosity compiler's Rust engine, compiled to WebAssembly. Viscosity
rewrites JavaScript arrays of objects (and Python lists of dataclass
instances) into struct-of-arrays layouts when it can prove the rewrite is
safe, and explains every decision. Its output is byte-identical to the
TypeScript engine's (`@viscosity/cli`).

## Node

```js
import { compile, compileWith, compileLanguage } from '@viscosity/wasm';

const { code, explain } = compile(source);                 // auto, bounds check, min size 64
const r = compileWith(source, 'opt-in', 'assume', 64);     // mode, bounds, min size
const py = compileLanguage('python', source, 'auto', 'check', 64, true); // last: --python-auto
```

The Node build loads the `.wasm` synchronously, so the functions are ready on
import (CommonJS `require` works too).

## Browsers and bundlers

```js
import init, { compile } from '@viscosity/wasm';   // or '@viscosity/wasm/web'
await init();                                       // fetches viscosity_wasm_bg.wasm next to the module
// or: await init({ module_or_path: '/assets/viscosity_wasm_bg.wasm' })
const { code, explain } = compile(source);
```

The raw module is exported as `@viscosity/wasm/viscosity_wasm_bg.wasm`
(about 1.3 MB, 0.5 MB gzipped). Compile errors throw an `Error`. The
TypeScript types use `Symbol.dispose`, so include `esnext.disposable` (or
`esnext`) in `lib`.

## Building

```sh
npm install          # binaryen, for the optional wasm-opt step
node build.mjs       # cargo build (wasm32) + wasm-bindgen (nodejs, web) + wasm-opt -O3
node smoke.mjs       # npm pack, install into an empty dir, compare with the TS CLI
```

Needs the `wasm32-unknown-unknown` Rust target and `wasm-bindgen-cli` at the
version pinned in `Cargo.lock` (0.2.106).

## Licence

MIT © Tariq Shams. The `.wasm` statically links Rust crates (oxc,
wasm-bindgen, rustc-hash, ICU4X and others); their licence texts are in
`THIRD_PARTY_LICENSES.txt`.
