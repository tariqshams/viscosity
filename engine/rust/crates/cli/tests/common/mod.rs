//! Shared by the parity and differential tests: where the test programs and
//! the fixtures generated from the TypeScript engine live.

#![allow(dead_code)]

use std::fs;
use std::path::{Path, PathBuf};

use viscosity_core::{compile, Bounds, CompileOptions, CompileResult, Mode};
use viscosity_frontend_js::JsPlugin;

/// The cargo workspace root (`engine/rust`).
pub fn root() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("../..")
}

pub fn expected_dir() -> PathBuf {
    root().join("tests/expected")
}

/// A test program and the fixture name prefix it maps to.
#[derive(Clone, Debug)]
pub struct Program {
    pub path: PathBuf,
    /// e.g. `corpus_basic_soa`
    pub name: String,
    pub source: String,
    /// One of `corpus`, `e2e`, `extra`.
    pub suite: &'static str,
}

impl Program {
    /// `// viscosity(opt-in): ...` headers compile in opt-in mode, exactly
    /// as the TS differential test (and `gen_expected.mjs`) do.
    pub fn mode(&self) -> Mode {
        if self.source.contains("// viscosity(opt-in):") {
            Mode::OptIn
        } else {
            Mode::Auto
        }
    }

    pub fn compile(&self, bounds: Bounds) -> CompileResult {
        let opts = CompileOptions { mode: self.mode(), bounds, ..CompileOptions::default() };
        compile(&self.source, &JsPlugin, opts).unwrap_or_else(|e| panic!("{}: {e}", self.name))
    }
}

/// Every program the TS fixtures were generated from, sorted per suite.
pub fn programs() -> Vec<Program> {
    let ts = root().join("../ts/packages");
    let suites: [(&str, PathBuf); 3] = [
        ("corpus", ts.join("frontend-js/test/corpus")),
        ("e2e", ts.join("bench/e2e")),
        ("extra", root().join("tests/extra")),
    ];
    let mut out = Vec::new();
    for (suite, dir) in suites {
        let mut files: Vec<PathBuf> = fs::read_dir(&dir)
            .unwrap_or_else(|e| panic!("{}: {e}", dir.display()))
            .map(|e| e.expect("dir entry").path())
            .filter(|p| p.extension().is_some_and(|e| e == "js"))
            .collect();
        files.sort();
        for path in files {
            let stem = path.file_stem().expect("a file name").to_string_lossy().to_string();
            let source = fs::read_to_string(&path).expect("readable");
            out.push(Program { name: format!("{suite}_{stem}"), path, source, suite });
        }
    }
    out
}

/// The bounds variants fixtures exist for, with their file-name suffix.
pub const VARIANTS: [(&str, Bounds); 2] = [("", Bounds::Check), (".assume", Bounds::Assume)];
