//! `viscosity`: an automatic data-layout optimizer for JavaScript and
//! Python.
//!
//! The Rust port of `engine/ts/packages/cli`. `build`, `explain` and their
//! options behave exactly like the TypeScript CLI; `.py` files use the
//! Python plugin. `profile` (PGO) runs the instrumented program with `node`,
//! like the TS version, so it needs Node.js on the `PATH`; like the TS
//! version, it rejects Python. TypeScript input is not supported by the
//! port.
//!
//! `build` and `explain` take several files. They are independent, so they
//! are compiled in parallel (`--jobs`, default one thread per CPU) on scoped
//! threads; the output is printed in the order the files were given.

mod profile;

use std::collections::HashMap;
use std::fs;
use std::io::Write;
use std::path::{Path, PathBuf};
use std::process::ExitCode;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::Mutex;

use viscosity_core::{compile, explain_with_frames, Bounds, CompileOptions, Mode};
use viscosity_frontend_js::JsPlugin;
use viscosity_frontend_python::PyPlugin;

const HELP: &str = "viscosity: rewrites arrays of objects (JavaScript, Python) into struct-of-arrays layouts
when it can prove it is safe and expects it to be faster.

Usage:
  viscosity build <file> [-o out.js] [options]   compile a file
  viscosity build <file>... -o <dir> [options]   compile several files into dir/
  viscosity explain <file>... [options]          show every decision and why
  viscosity profile <file> [-o profile.json]     run the program and record collection sizes (needs node)
  viscosity --help | --version

Options:
  -o, --out <path>          build: the output file, or a directory (several
                            files, or a path ending in /) that gets one file
                            per input, named after it
  --frames                  explain: under each refusal, show the source line
                            with carets under the code it is about
  --jobs <n>                compile up to n files at once, in parallel
                            (default: one per CPU)
  --mode auto|opt-in        auto (default) decides everything; opt-in only
                            transforms collections marked // @viscosity soa
  --bounds check|assume     check (default) keeps out-of-bounds behaviour
                            identical; assume trusts the program
  --min-size <n>            leave collections smaller than n alone (default 64)
  --profile <profile.json>  use measured sizes from `viscosity profile`
  --explain                 also print the explanation when building
  --python-auto             Python: transform without annotations (CPython
                            column access is slower; the gain is memory)
";

/// A failure. As in the TS CLI, only a usage error (the command line itself
/// was wrong) is followed by the help text.
#[derive(Debug)]
enum CliError {
    Usage(String),
    Other(String),
}

impl From<String> for CliError {
    fn from(e: String) -> Self {
        CliError::Other(e)
    }
}

/// Parsed command-line arguments.
#[derive(Debug, Default)]
struct Args {
    cmd: String,
    files: Vec<String>,
    out: String,
    explain: bool,
    frames: bool,
    /// 0: one per CPU.
    jobs: usize,
    profile: String,
    opts: CompileOptions,
}

fn parse_args(argv: &[String]) -> Result<Args, CliError> {
    let mut args = Args { cmd: argv[0].clone(), ..Args::default() };
    let mut i = 1;
    while i < argv.len() {
        let a = argv[i].as_str();
        let mut next = || {
            i += 1;
            argv.get(i).cloned().ok_or_else(|| CliError::Usage(format!("{a} needs a value")))
        };
        match a {
            "-o" | "--out" => args.out = next()?,
            "--explain" => args.explain = true,
            "--frames" => args.frames = true,
            "--jobs" | "-j" => {
                let v = js_to_number(&next()?);
                if !(v >= 1.0 && v.fract() == 0.0) {
                    return Err(CliError::Usage("--jobs must be a whole number of at least 1".into()));
                }
                args.jobs = v.min(usize::MAX as f64) as usize;
            }
            "--mode" => {
                args.opts.mode = match next()?.as_str() {
                    "auto" => Mode::Auto,
                    "opt-in" => Mode::OptIn,
                    _ => return Err(CliError::Usage("--mode must be auto or opt-in".into())),
                }
            }
            "--bounds" => {
                args.opts.bounds = match next()?.as_str() {
                    "check" => Bounds::Check,
                    "assume" => Bounds::Assume,
                    _ => return Err(CliError::Usage("--bounds must be check or assume".into())),
                }
            }
            "--min-size" => args.opts.min_size = js_to_number(&next()?),
            "--profile" => args.profile = next()?,
            "--python-auto" => args.opts.python_auto = true,
            _ if !a.starts_with('-') => args.files.push(a.to_string()),
            _ => return Err(CliError::Usage(format!("unknown option {a}"))),
        }
        i += 1;
    }
    Ok(args)
}

/// JavaScript's `Number(string)`, for `--min-size`.
fn js_to_number(s: &str) -> f64 {
    let t = s.trim_matches(|c: char| c.is_whitespace() || c == '\u{feff}');
    if t.is_empty() {
        return 0.0;
    }
    let radix = |prefix: [&str; 2], radix: u32| {
        prefix.iter().find_map(|p| t.strip_prefix(p)).map(|d| match u128::from_str_radix(d, radix) {
            Ok(v) if !d.is_empty() && !d.starts_with('+') => v as f64,
            _ => f64::NAN,
        })
    };
    if let Some(v) = radix(["0x", "0X"], 16).or_else(|| radix(["0o", "0O"], 8)).or_else(|| radix(["0b", "0B"], 2)) {
        return v;
    }
    match t {
        "Infinity" | "+Infinity" => return f64::INFINITY,
        "-Infinity" => return f64::NEG_INFINITY,
        _ => {}
    }
    // Rust accepts "inf", "nan" and friends; JavaScript does not.
    if t.chars().all(|c| c.is_ascii_digit() || matches!(c, '.' | 'e' | 'E' | '+' | '-')) {
        t.parse().unwrap_or(f64::NAN)
    } else {
        f64::NAN
    }
}

/// What compiling one file produced.
struct Compiled {
    /// The compiled code, when it goes to stdout (empty when written to a file).
    code: String,
    /// The explain text (with code frames if `--frames`).
    explain: String,
}

fn run(argv: &[String], stdout: &mut impl Write, stderr: &mut impl Write) -> Result<bool, CliError> {
    let mut a = parse_args(argv)?;
    if a.files.is_empty() {
        return Err(CliError::Usage("missing <file>".into()));
    }
    if !matches!(a.cmd.as_str(), "build" | "explain" | "profile") {
        return Err(CliError::Usage(format!("unknown command \"{}\"", a.cmd)));
    }
    if a.files.iter().any(|f| matches!(extension(f), "ts" | "mts" | "tsx")) {
        return Err(CliError::Usage("TypeScript input is not supported by the Rust port (the TypeScript engine strips types with sucrase first)".into()));
    }
    let io = |e: std::io::Error| CliError::Other(e.to_string());
    if a.cmd == "profile" {
        if a.files.len() > 1 {
            return Err(CliError::Usage("profile takes one file".into()));
        }
        if extension(&a.files[0]) == "py" {
            return Err("profile runs JavaScript programs only; Python profiling is not supported yet"
                .to_string()
                .into());
        }
        let text = profile::profile(&a.files[0])? + "\n";
        if a.out.is_empty() {
            stdout.write_all(text.as_bytes()).map_err(io)?;
        } else {
            fs::write(&a.out, text).map_err(io)?;
        }
        return Ok(true);
    }
    if !a.profile.is_empty() {
        a.opts.profile = Some(read_profile(&a.profile)?);
    }
    let several = a.files.len() > 1;
    let build = a.cmd == "build";
    // build: where each output goes (None: stdout).
    let mut outs: Vec<Option<PathBuf>> =
        a.files.iter().map(|_| (!a.out.is_empty()).then(|| PathBuf::from(&a.out))).collect();
    if build && (several || a.out.ends_with('/') || (!a.out.is_empty() && Path::new(&a.out).is_dir())) {
        if a.out.is_empty() {
            return Err(CliError::Usage("several files need an output directory: -o <dir>".into()));
        }
        outs = a.files.iter().map(|f| Some(Path::new(&a.out).join(output_name(f)))).collect();
        let mut seen: HashMap<&PathBuf, &str> = HashMap::new();
        for (o, f) in outs.iter().flatten().zip(&a.files) {
            if let Some(first) = seen.insert(o, f) {
                return Err(CliError::Usage(format!("{first} and {f} would both be written to {}", o.display())));
            }
        }
        fs::create_dir_all(&a.out).map_err(io)?;
    }
    let jobs = if a.jobs == 0 { std::thread::available_parallelism().map_or(1, |n| n.get()) } else { a.jobs };
    let results = for_each_parallel(a.files.len(), jobs, |k| compile_file(&a, k, outs[k].as_deref()));
    let mut ok = true;
    for (k, (file, r)) in a.files.iter().zip(results).enumerate() {
        let r = match r {
            Ok(r) => r,
            // One file: the error ends the run, as it always did.
            Err(e) if !several => return Err(CliError::Other(e)),
            Err(e) => {
                writeln!(stderr, "viscosity: {file}: {e}").map_err(io)?;
                ok = false;
                continue;
            }
        };
        if build {
            stdout.write_all(r.code.as_bytes()).map_err(io)?;
            if a.explain {
                if several {
                    writeln!(stderr, "== {file} ==").map_err(io)?;
                }
                writeln!(stderr, "{}", r.explain).map_err(io)?;
            }
            continue;
        }
        let body = if r.explain.is_empty() { "No arrays of objects found." } else { &r.explain };
        if several {
            writeln!(stdout, "{}== {file} ==", if k > 0 { "\n" } else { "" }).map_err(io)?;
        }
        writeln!(stdout, "{body}").map_err(io)?;
    }
    Ok(ok)
}

/// Compiles file `k` of `a.files`, writing the code to `out` if given.
fn compile_file(a: &Args, k: usize, out: Option<&Path>) -> Result<Compiled, String> {
    let file = &a.files[k];
    let src = fs::read_to_string(file).map_err(|e| e.to_string())?;
    let opts = a.opts.clone();
    // A panic is a bug, but with many files it should cost only that file.
    let r = std::panic::catch_unwind(|| {
        if extension(file) == "py" {
            compile(&src, &PyPlugin, opts)
        } else {
            compile(&src, &JsPlugin, opts)
        }
    })
    .map_err(|_| "internal error: the compiler panicked (see above)".to_string())?;
    let r = r.map_err(|e| e.to_string())?;
    let explain = if a.frames { explain_with_frames(&r.plan, &src) } else { r.explain };
    let code = match out {
        Some(path) => {
            fs::write(path, &r.code).map_err(|e| e.to_string())?;
            String::new()
        }
        None if a.cmd == "build" => r.code,
        None => String::new(),
    };
    Ok(Compiled { code, explain })
}

/// Runs `f(0), ..., f(n - 1)` on up to `jobs` scoped threads and returns
/// the results in index order, whatever order they finish in. Threads take
/// the next index from a shared counter, so a slow file never holds up the
/// others.
fn for_each_parallel<T: Send>(n: usize, jobs: usize, f: impl Fn(usize) -> T + Sync) -> Vec<T> {
    let jobs = jobs.clamp(1, n.max(1));
    if jobs == 1 {
        return (0..n).map(f).collect();
    }
    let next = AtomicUsize::new(0);
    let slots: Mutex<Vec<Option<T>>> = Mutex::new((0..n).map(|_| None).collect());
    std::thread::scope(|s| {
        for _ in 0..jobs {
            s.spawn(|| loop {
                let k = next.fetch_add(1, Ordering::Relaxed);
                if k >= n {
                    break;
                }
                let r = f(k);
                slots.lock().expect("no thread panicked holding the lock")[k] = Some(r);
            });
        }
    });
    slots.into_inner().expect("not poisoned").into_iter().map(|r| r.expect("every index was run")).collect()
}

fn extension(file: &str) -> &str {
    Path::new(file).extension().and_then(|e| e.to_str()).unwrap_or("")
}

/// The name a compiled file gets in an output directory: its own. (The
/// TypeScript CLI also renames `.ts` inputs, which the port rejects.)
fn output_name(file: &str) -> std::ffi::OsString {
    Path::new(file).file_name().map_or_else(|| file.into(), |n| n.to_os_string())
}

/// Reads a `viscosity profile` file: `{ name: { maxLength } }`.
fn read_profile(path: &str) -> Result<HashMap<String, f64>, String> {
    let text = fs::read_to_string(path).map_err(|e| e.to_string())?;
    let json: serde_json::Value = serde_json::from_str(&text).map_err(|e| e.to_string())?;
    let obj = json.as_object().ok_or("the profile must be a JSON object")?;
    Ok(obj
        .iter()
        .filter_map(|(name, v)| v.get("maxLength").and_then(|n| n.as_f64()).map(|n| (name.clone(), n)))
        .collect())
}

fn main() -> ExitCode {
    let argv: Vec<String> = std::env::args().skip(1).collect();
    let (mut stdout, mut stderr) = (std::io::stdout().lock(), std::io::stderr().lock());
    if argv.is_empty() || argv[0] == "--help" || argv[0] == "-h" {
        let _ = stdout.write_all(HELP.as_bytes());
        return ExitCode::SUCCESS;
    }
    if argv[0] == "--version" {
        let _ = writeln!(stdout, "viscosity {}", env!("CARGO_PKG_VERSION"));
        return ExitCode::SUCCESS;
    }
    match run(&argv, &mut stdout, &mut stderr) {
        Ok(true) => ExitCode::SUCCESS,
        Ok(false) => ExitCode::FAILURE,
        Err(CliError::Usage(e)) => {
            let _ = write!(stderr, "viscosity: {e}\n\n{HELP}");
            ExitCode::FAILURE
        }
        Err(CliError::Other(e)) => {
            let _ = writeln!(stderr, "viscosity: {e}");
            ExitCode::FAILURE
        }
    }
}

#[cfg(test)]
mod tests {
    use super::js_to_number;

    #[test]
    fn number_parsing_matches_javascript() {
        assert_eq!(js_to_number("64"), 64.0);
        assert_eq!(js_to_number(" 12 "), 12.0);
        assert_eq!(js_to_number(""), 0.0);
        assert_eq!(js_to_number("1e3"), 1000.0);
        assert_eq!(js_to_number("0x10"), 16.0);
        assert_eq!(js_to_number("2.5"), 2.5);
        assert_eq!(js_to_number("Infinity"), f64::INFINITY);
        assert!(js_to_number("abc").is_nan());
        assert!(js_to_number("inf").is_nan());
        assert!(js_to_number("nan").is_nan());
    }
}
