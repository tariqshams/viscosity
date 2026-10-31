//! Profile-guided optimization (book chapter 109): run the ORIGINAL program
//! with light instrumentation that records how big each candidate collection
//! really gets, then feed those numbers to the cost model.
//!
//! Like the TypeScript CLI, this runs the instrumented program with `node`.

use std::fs;
use std::process::{Command, Stdio};

use viscosity_core::{analyze, LanguagePlugin};
use viscosity_frontend_js::JsPlugin;

const PRELUDE: &str = "
const __vsc_seen = [];
function __vsc_track(name, arr) { __vsc_seen.push([name, arr]); return arr; }
process.on('exit', () => {
  const p = {};
  for (const [n, a] of __vsc_seen) p[n] = { maxLength: Math.max(p[n]?.maxLength ?? 0, a.length) };
  require('node:fs').writeFileSync(process.env.VSC_PROFILE_OUT, JSON.stringify(p, null, 2));
});
";

/// Wraps every candidate collection's initializer in `__vsc_track(...)`.
pub fn instrument(source: &str) -> Result<String, String> {
    let lowered = JsPlugin.lower(source).map_err(|e| e.to_string())?;
    let a = analyze(&lowered.module);
    let mut edits: Vec<(u32, u32, &str)> = a
        .collections
        .iter()
        .map(|c| {
            let src = lowered.module.inst(c.init).src.expect("collection initializers have a source");
            (src.start, src.end, c.name.as_str())
        })
        .collect();
    edits.sort_by_key(|e| std::cmp::Reverse(e.0));
    let mut out = source.to_string();
    for (start, end, name) in edits {
        let (start, end) = (start as usize, end as usize);
        let quoted = serde_json::to_string(name).expect("strings serialize");
        let wrapped = format!("__vsc_track({quoted}, {})", &out[start..end]);
        out.replace_range(start..end, &wrapped);
    }
    Ok(format!("{PRELUDE}{out}"))
}

/// Runs `file` under node and returns the profile as pretty JSON.
pub fn profile(file: &str) -> Result<String, String> {
    let source = fs::read_to_string(file).map_err(|e| e.to_string())?;
    let dir = std::env::temp_dir().join(format!("vsc-prof-{}", std::process::id()));
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let inst = dir.join("instrumented.cjs");
    let out = dir.join("profile.json");
    fs::write(&inst, instrument(&source)?).map_err(|e| e.to_string())?;
    let status = Command::new("node")
        .arg(&inst)
        .env("VSC_PROFILE_OUT", &out)
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .status()
        .map_err(|e| format!("could not run node (profiling needs Node.js on the PATH): {e}"))?;
    if !status.success() {
        return Err(format!("the instrumented program failed ({status})"));
    }
    let json = fs::read_to_string(&out).map_err(|e| e.to_string())?;
    let _ = fs::remove_dir_all(&dir);
    Ok(json)
}
