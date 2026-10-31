//! Shared by the parity and differential tests: where the test programs and
//! the fixtures generated from the TypeScript engine live.

#![allow(dead_code)]

use std::fs;
use std::path::{Path, PathBuf};

use viscosity_core::{compile, Bounds, CompileOptions, CompileResult, Mode};
use viscosity_frontend_js::JsPlugin;
use viscosity_frontend_python::PyPlugin;

/// The language of a test program.
#[derive(Copy, Clone, PartialEq, Eq, Debug)]
pub enum Lang {
    Js,
    Python,
}

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
    /// One of `corpus`, `e2e`, `extra` (JavaScript) or `pycorpus`,
    /// `pye2e`, `pyextra` (Python).
    pub suite: &'static str,
    pub lang: Lang,
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

    /// Python programs compile with `pythonAuto: true`, as the TS Python
    /// differential test (and `gen_expected.mjs`) do, unless their header
    /// reads `# viscosity(no-auto):`.
    pub fn python_auto(&self) -> bool {
        self.lang == Lang::Python && !self.source.contains("# viscosity(no-auto):")
    }

    /// The file extension of the program and of its code fixtures.
    pub fn ext(&self) -> &'static str {
        match self.lang {
            Lang::Js => "js",
            Lang::Python => "py",
        }
    }

    pub fn compile(&self, bounds: Bounds) -> CompileResult {
        let opts =
            CompileOptions { mode: self.mode(), bounds, python_auto: self.python_auto(), ..CompileOptions::default() };
        let r = match self.lang {
            Lang::Js => compile(&self.source, &JsPlugin, opts),
            Lang::Python => compile(&self.source, &PyPlugin, opts),
        };
        r.unwrap_or_else(|e| panic!("{}: {e}", self.name))
    }
}

/// Every program the TS fixtures were generated from, sorted per suite.
pub fn programs() -> Vec<Program> {
    let ts = root().join("../ts/packages");
    // (suite, directory, language, only these files)
    let suites: [(&str, PathBuf, Lang, Option<&[&str]>); 6] = [
        ("corpus", ts.join("frontend-js/test/corpus"), Lang::Js, None),
        ("e2e", ts.join("bench/e2e"), Lang::Js, None),
        ("extra", root().join("tests/extra"), Lang::Js, None),
        ("pycorpus", ts.join("frontend-python/test/corpus"), Lang::Python, None),
        ("pye2e", ts.join("bench/e2e-py"), Lang::Python, Some(&["particles.py"])),
        ("pyextra", root().join("tests/extra"), Lang::Python, None),
    ];
    let mut out = Vec::new();
    for (suite, dir, lang, only) in suites {
        let ext = if lang == Lang::Js { "js" } else { "py" };
        let mut files: Vec<PathBuf> = fs::read_dir(&dir)
            .unwrap_or_else(|e| panic!("{}: {e}", dir.display()))
            .map(|e| e.expect("dir entry").path())
            .filter(|p| p.extension().is_some_and(|e| e == ext))
            .filter(|p| only.is_none_or(|o| o.iter().any(|f| p.file_name().is_some_and(|n| n == *f))))
            .collect();
        files.sort();
        for path in files {
            let stem = path.file_stem().expect("a file name").to_string_lossy().to_string();
            let source = fs::read_to_string(&path).expect("readable");
            out.push(Program { name: format!("{suite}_{stem}"), path, source, suite, lang });
        }
    }
    out
}

/// The bounds variants fixtures exist for, with their file-name suffix.
pub const VARIANTS: [(&str, Bounds); 2] = [("", Bounds::Check), (".assume", Bounds::Assume)];
