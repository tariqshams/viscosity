//! Viscosity for the browser (the playground), via wasm-bindgen.
//!
//! ```js
//! import init, { compile, compileWith } from './viscosity_wasm.js';
//! await init();
//! const { code, explain } = compile(source);
//! const r = compileWith(source, 'opt-in', 'assume', 64);
//! // Python (or JavaScript) by name; the last argument is `--python-auto`.
//! const py = compileLanguage('python', source, 'auto', 'check', 64, true);
//! ```
//!
//! Build with `cargo build --target wasm32-unknown-unknown -p viscosity-wasm
//! --release`, then `wasm-bindgen --target web` on the `.wasm` file.

use viscosity_core::{compile as compile_with_plugin, Bounds, CompileOptions, Mode};
use viscosity_frontend_js::JsPlugin;
use viscosity_frontend_python::PyPlugin;
use wasm_bindgen::prelude::*;

/// The result of a compilation: the rewritten source and the
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
    compile_language("javascript", source, mode, bounds, min_size, false)
}

/// Compiles `language` (`"javascript"` or `"python"`) with explicit
/// options. `python_auto` is the CLI's `--python-auto`: transform Python
/// collections without `# @viscosity soa` annotations.
#[wasm_bindgen(js_name = compileLanguage)]
pub fn compile_language(
    language: &str,
    source: &str,
    mode: &str,
    bounds: &str,
    min_size: f64,
    python_auto: bool,
) -> Result<Output, JsError> {
    options(language, source, mode, bounds, min_size, python_auto).map_err(|e| JsError::new(&e))
}

fn options(
    language: &str,
    source: &str,
    mode: &str,
    bounds: &str,
    min_size: f64,
    python_auto: bool,
) -> Result<Output, String> {
    let mode = match mode {
        "auto" => Mode::Auto,
        "opt-in" => Mode::OptIn,
        _ => return Err("mode must be auto or opt-in".into()),
    };
    let bounds = match bounds {
        "check" => Bounds::Check,
        "assume" => Bounds::Assume,
        _ => return Err("bounds must be check or assume".into()),
    };
    let opts = CompileOptions { mode, bounds, min_size, python_auto, ..CompileOptions::default() };
    run_language(language, source, opts)
}

fn run(source: &str, opts: CompileOptions) -> Result<Output, JsError> {
    run_language("javascript", source, opts).map_err(|e| JsError::new(&e))
}

fn run_language(language: &str, source: &str, opts: CompileOptions) -> Result<Output, String> {
    let r = match language {
        "javascript" | "js" => compile_with_plugin(source, &JsPlugin, opts),
        "python" | "py" => compile_with_plugin(source, &PyPlugin, opts),
        _ => return Err("language must be javascript or python".into()),
    };
    let r = r.map_err(|e| e.to_string())?;
    Ok(Output { code: r.code, explain: r.explain })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn python_by_name() {
        let src = "from dataclasses import dataclass\n\n@dataclass\nclass P:\n    x: float\n\nps = []\nfor i in range(100):\n    ps.append(P(i * 1.0))\nfor p in ps:\n    p.x += 1.0\n";
        let r = options("python", src, "auto", "check", 64.0, true).expect("compiles");
        assert!(r.code.contains("ps = _Vsc_ps()"), "{}", r.code);
        let r = options("python", src, "auto", "check", 64.0, false).expect("compiles");
        assert_eq!(r.code, src);
        assert!(options("cobol", src, "auto", "check", 64.0, false).is_err());
        assert!(options("javascript", "const xs = [];\n", "auto", "check", 64.0, false).is_ok());
    }
}
