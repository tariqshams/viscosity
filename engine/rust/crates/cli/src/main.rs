//! `viscosity`: an automatic data-layout optimizer for JavaScript and
//! Python.
//!
//! The Rust port of `engine/ts/packages/cli`. `build`, `explain` and their
//! options behave exactly like the TypeScript CLI; `.py` files use the
//! Python plugin. `profile` (PGO) runs the instrumented program with `node`,
//! like the TS version, so it needs Node.js on the `PATH`; like the TS
//! version, it rejects Python. TypeScript input is not supported by the
//! port.

mod profile;

use std::collections::HashMap;
use std::fs;
use std::io::Write;
use std::path::Path;
use std::process::ExitCode;

use viscosity_core::{compile, Bounds, CompileOptions, Mode};
use viscosity_frontend_js::JsPlugin;
use viscosity_frontend_python::PyPlugin;

const HELP: &str = "viscosity: rewrites arrays of objects (JavaScript, Python) into struct-of-arrays layouts
when it can prove it is safe and expects it to be faster.

Usage:
  viscosity build <file> [-o out.js] [options]   compile a file
  viscosity explain <file> [options]             show every decision and why
  viscosity profile <file> [-o profile.json]     run the program and record collection sizes (needs node)
  viscosity --help | --version

Options:
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
    file: String,
    out: String,
    explain: bool,
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
            _ if !a.starts_with('-') && args.file.is_empty() => args.file = a.to_string(),
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

fn run(argv: &[String], stdout: &mut impl Write, stderr: &mut impl Write) -> Result<(), CliError> {
    let mut a = parse_args(argv)?;
    if a.file.is_empty() {
        return Err(CliError::Usage("missing <file>".into()));
    }
    let ext = Path::new(&a.file).extension().and_then(|e| e.to_str()).unwrap_or("");
    let python = ext == "py";
    if matches!(ext, "ts" | "mts" | "tsx") {
        return Err(CliError::Usage("TypeScript input is not supported by the Rust port (the TypeScript engine strips types with sucrase first)".into()));
    }
    let io = |e: std::io::Error| CliError::Other(e.to_string());
    if a.cmd == "profile" {
        if python {
            return Err("profile runs JavaScript programs only; Python profiling is not supported yet"
                .to_string()
                .into());
        }
        let text = profile::profile(&a.file)? + "\n";
        if a.out.is_empty() {
            stdout.write_all(text.as_bytes()).map_err(io)?;
        } else {
            fs::write(&a.out, text).map_err(io)?;
        }
        return Ok(());
    }
    if !a.profile.is_empty() {
        a.opts.profile = Some(read_profile(&a.profile)?);
    }
    let src = fs::read_to_string(&a.file).map_err(io)?;
    let r = if python { compile(&src, &PyPlugin, a.opts) } else { compile(&src, &JsPlugin, a.opts) };
    let r = r.map_err(|e| e.to_string())?;
    match a.cmd.as_str() {
        "explain" => {
            let text = if r.explain.is_empty() { "No arrays of objects found." } else { &r.explain };
            writeln!(stdout, "{text}").map_err(io)?;
        }
        "build" => {
            if a.out.is_empty() {
                stdout.write_all(r.code.as_bytes()).map_err(io)?;
            } else {
                fs::write(&a.out, &r.code).map_err(io)?;
            }
            if a.explain {
                writeln!(stderr, "{}", r.explain).map_err(io)?;
            }
        }
        cmd => return Err(CliError::Usage(format!("unknown command \"{cmd}\""))),
    }
    Ok(())
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
        Ok(()) => ExitCode::SUCCESS,
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
