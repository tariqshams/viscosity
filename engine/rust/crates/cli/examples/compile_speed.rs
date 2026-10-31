//! In-process compile time of the Rust engine on the end-to-end benchmark
//! programs: warm up, then time each `compile()` call and report the median
//! and minimum in microseconds. The TypeScript counterpart is
//! `node scripts/compile_speed.mjs`.
//!
//! Run with `cargo run --release -p viscosity-cli --example compile_speed`.

use std::path::Path;
use std::time::Instant;

use viscosity_core::{compile, CompileOptions};
use viscosity_frontend_js::JsPlugin;

fn env_or(name: &str, default: usize) -> usize {
    std::env::var(name).ok().and_then(|v| v.parse().ok()).unwrap_or(default)
}

fn main() {
    let dir = Path::new(env!("CARGO_MANIFEST_DIR")).join("../../../ts/packages/bench/e2e");
    let (runs, warmup) = (env_or("RUNS", 500), env_or("WARMUP", 100));
    let mut files: Vec<_> = std::fs::read_dir(&dir)
        .expect("the e2e directory")
        .map(|e| e.expect("entry").path())
        .filter(|p| p.extension().is_some_and(|e| e == "js"))
        .collect();
    files.sort();
    for f in files {
        let src = std::fs::read_to_string(&f).expect("readable");
        for _ in 0..warmup {
            compile(&src, &JsPlugin, CompileOptions::default()).expect("compiles");
        }
        let mut us: Vec<f64> = (0..runs)
            .map(|_| {
                let t0 = Instant::now();
                let r = compile(&src, &JsPlugin, CompileOptions::default()).expect("compiles");
                std::hint::black_box(r);
                t0.elapsed().as_secs_f64() * 1e6
            })
            .collect();
        us.sort_by(f64::total_cmp);
        let name = f.file_name().expect("a name").to_string_lossy();
        println!("{name:<14} median {:>8.1} us   min {:>8.1} us", us[us.len() / 2], us[0]);
    }
}
