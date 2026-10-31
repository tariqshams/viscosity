//! Viscosity for the browser (the playground), via wasm-bindgen.
//!
//! ```js
//! import init, { compile, compileWith } from './viscosity_wasm.js';
//! await init();
//! const { code, explain } = compile(source);
//! const r = compileWith(source, 'opt-in', 'assume', 64);
//! ```
//!
//! Build with `cargo build --target wasm32-unknown-unknown -p viscosity-wasm
//! --release`, then `wasm-bindgen --target web` on the `.wasm` file.

use viscosity_core::{compile as compile_js, Bounds, CompileOptions, Mode};
use viscosity_frontend_js::JsPlugin;
use wasm_bindgen::prelude::*;

/// The result of a compilation: the rewritten JavaScript and the
/// explanation of every decision.
#[wasm_bindgen(getter_with_clone)]
pub struct Output {
    pub code: String,
    pub explain: String,
}

/// Compiles JavaScript with the default options (auto mode, bounds checks,
/// a 64-element threshold).
#[wasm_bindgen]
pub fn compile(source: &str) -> Result<Output, JsError> {
    run(source, CompileOptions::default())
}

/// Compiles with explicit options: `mode` is `"auto"` or `"opt-in"`,
/// `bounds` is `"check"` or `"assume"`.
#[wasm_bindgen(js_name = compileWith)]
pub fn compile_with(source: &str, mode: &str, bounds: &str, min_size: f64) -> Result<Output, JsError> {
    let mode = match mode {
        "auto" => Mode::Auto,
        "opt-in" => Mode::OptIn,
        _ => return Err(JsError::new("mode must be auto or opt-in")),
    };
    let bounds = match bounds {
        "check" => Bounds::Check,
        "assume" => Bounds::Assume,
        _ => return Err(JsError::new("bounds must be check or assume")),
    };
    run(source, CompileOptions { mode, bounds, min_size, ..CompileOptions::default() })
}

fn run(source: &str, opts: CompileOptions) -> Result<Output, JsError> {
    let r = compile_js(source, &JsPlugin, opts).map_err(|e| JsError::new(&e.to_string()))?;
    Ok(Output { code: r.code, explain: r.explain })
}
