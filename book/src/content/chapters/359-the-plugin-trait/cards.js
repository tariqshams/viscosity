// Chapter 359 cards. Keys are stable ids: never rename them.

export const prompts = {
  'pt-extra': {
    q: 'What is `type Extra;` in the `LanguagePlugin` trait?',
    a: 'An associated type: each plugin chooses it, for the data its `lower` passes to its `emit`.',
  },
  'pt-lowered': {
    q: 'What does `LoweredModule<X>` hold?',
    a: 'The VIR `module`, the `annotations` found in the source, and `extra: X`, the plugin’s private data.',
  },
  'pt-mixup': {
    q: 'You pass the Python plugin’s lowered module to `JsPlugin.emit`. What happens in TypeScript, and in Rust?',
    a: 'TypeScript accepts it (the cast `as JsLowered` isn’t checked) and it returned `undefined`. Rust rejects it: E0308, expected `LoweredModule<JsExtra>`, found `LoweredModule<PyExtra>`.',
  },
  'pt-two': {
    q: 'Which two types implement `LanguagePlugin`, and what are their `Extra`s?',
    a: '`JsPlugin` with `JsExtra` (node facts, binding map) and `PyPlugin` with `PyExtra` (the lowered Python, or the reason it is unsupported).',
  },
  'pt-mono': {
    q: 'How many copies of `compile<P: LanguagePlugin>` end up in the `viscosity` binary, and which?',
    a: 'One per plugin it is called with: `compile::<JsPlugin>` and `compile::<PyPlugin>`.',
  },
  'pt-result': {
    q: 'Why can `compile` return the same `CompileResult` type for every plugin?',
    a: '`CompileResult` (code, plan, analysis, explain) doesn’t mention `Extra`: the plugin’s data is used and dropped inside `compile`.',
  },
  'pt-e0191': {
    q: 'What does E0191 say about `Vec<&dyn LanguagePlugin>`?',
    a: 'The value of the associated type `Extra` must be specified: a trait object has to name every associated type.',
  },
  'pt-dyncompat': {
    q: 'Is `LanguagePlugin` dyn compatible? Then why can’t one `Vec` hold both plugins as trait objects?',
    a: 'Yes: `&dyn LanguagePlugin<Extra = JsExtra>` compiles. But each `Extra` gives a different trait-object type, so `PyPlugin` doesn’t fit (E0271).',
  },
  'pt-branch': {
    q: 'How do the CLI and the wasm crate choose a plugin at run time without trait objects?',
    a: 'They branch first (on the extension or the language name) and call `compile` with a different plugin in each arm. Both arms return `Result<CompileResult, CompileError>`.',
  },
};

export const examples = {
  'mono-pick': {
    lang: 'rust',
    title: 'Branch first, then call the generic',
    code: `trait Plugin {
    type Extra;
    fn lower(&self, s: &str)
        -> Self::Extra;
    fn emit(&self, s: &str,
        x: &Self::Extra) -> String;
}

struct Js;
struct Py;

impl Plugin for Js {
    // the number of lines
    type Extra = usize;
    fn lower(&self, s: &str) -> usize {
        s.lines().count()
    }
    fn emit(&self, s: &str, n: &usize)
        -> String {
        format!("// {n} lines\\n{s}")
    }
}

impl Plugin for Py {
    // the first line
    type Extra = String;
    fn lower(&self, s: &str) -> String {
        let f = s.lines().next();
        f.unwrap_or("").to_string()
    }
    fn emit(&self, s: &str, f: &String)
        -> String {
        format!("# starts {f:?}\\n{s}")
    }
}

// one copy per P: compile::<Js>,
// compile::<Py>
fn compile<P: Plugin>(s: &str, p: &P)
    -> String {
    let x = p.lower(s);
    p.emit(s, &x)
}

fn main() {
    let src = "xs = []\\nys = []";
    for f in ["a.js", "b.py"] {
        let py = f.ends_with(".py");
        // both arms return a String
        let out = if py {
            compile(src, &Py)
        } else {
            compile(src, &Js)
        };
        println!("{f}:\\n{out}\\n");
    }
}`,
  },
};

const BASE = `trait Plugin {
    type Extra;
    fn exts(&self)
        -> &'static [&'static str];
    fn lower(&self, s: &str)
        -> Self::Extra;
    fn emit(&self, s: &str,
        x: &Self::Extra) -> String;
}

struct Js;
struct Py;

impl Plugin for Js {
    type Extra = usize;
    fn exts(&self)
        -> &'static [&'static str] {
        &[".js", ".mjs"]
    }
    fn lower(&self, s: &str) -> usize {
        s.lines().count()
    }
    fn emit(&self, _: &str, n: &usize)
        -> String {
        format!("js {n}")
    }
}

impl Plugin for Py {
    type Extra = String;
    fn exts(&self)
        -> &'static [&'static str] {
        &[".py"]
    }
    fn lower(&self, s: &str) -> String {
        s.to_uppercase()
    }
    fn emit(&self, _: &str, u: &String)
        -> String {
        format!("py {u}")
    }
}

// Plugin with Extra hidden. No
// associated type, so &dyn works.
trait AnyPlugin {
    fn handles(&self, file: &str)
        -> bool;
    fn compile(&self, src: &str)
        -> String;
}`;

const IMPL_HEAD = `impl<P: Plugin> AnyPlugin for P {`;
const PICK_SIG = `fn pick(file: &str)
    -> Option<&'static dyn AnyPlugin> {`;

const GOOD_COMPILE = `    fn compile(&self, src: &str)
        -> String {
        let x = self.lower(src);
        self.emit(src, &x)
    }`;

const GOOD_PICK = `${PICK_SIG}
    let all: [&dyn AnyPlugin; 2] =
        [&Js, &Py];
    all.into_iter()
        .find(|p| p.handles(file))
}`;

export const exercises = {
  anyPlugin: {
    lang: 'rust',
    title: 'Erase Extra behind a second trait',
    prompt:
      '`Plugin` has an associated type, so `&dyn Plugin` is E0191. Hide it: implement `AnyPlugin` for **every** `P: Plugin` at once. `handles` is true when the file name ends with one of the plugin’s extensions; `compile` runs `lower`, then `emit` with what `lower` returned. Then write `pick`, which returns the plugin that handles the file, or `None` if no plugin does.',
    starter: `${BASE}

${IMPL_HEAD}
    fn handles(&self, file: &str)
        -> bool {
        todo!()
    }
    fn compile(&self, src: &str)
        -> String {
        todo!()
    }
}

${PICK_SIG}
    todo!()
}`,
    solution: `${BASE}

${IMPL_HEAD}
    fn handles(&self, file: &str)
        -> bool {
        self.exts()
            .iter()
            .any(|e| file.ends_with(e))
    }
${GOOD_COMPILE}
}

${GOOD_PICK}`,
    tests: `#[test]
fn compile_runs_lower_then_emit() {
    assert_eq!(Js.compile("x\\ny"), "js 2");
    assert_eq!(Py.compile("xs = []"), "py XS = []");
}

#[test]
fn one_vec_holds_both() {
    let ps: Vec<&dyn AnyPlugin> = vec![&Js, &Py];
    let n = ps.iter().filter(|p| p.handles("x.js")).count();
    assert_eq!(n, 1);
}

#[test]
fn picks_by_extension() {
    let js = pick("a.mjs").unwrap();
    assert_eq!(js.compile(""), "js 0");
    let py = pick("b.py").unwrap();
    assert_eq!(py.compile("p"), "py P");
}

#[test]
fn unknown_files_get_none() {
    assert!(pick("c.rb").is_none());
    assert!(pick("notes.json").is_none());
}`,
    hints: [
      'A blanket impl, `impl<P: Plugin> AnyPlugin for P`, gives every plugin an `AnyPlugin` impl. Inside it you may call `Plugin` methods on `self`.',
      'In `compile`, keep the `Extra` in a local: `let x = self.lower(src);`, then `self.emit(src, &x)`. Its type is `P::Extra`, known inside each copy, and it never escapes.',
      'For `pick`, put `&Js` and `&Py` in an array of `&dyn AnyPlugin` and use `.into_iter().find(...)`. Use `ends_with`, not `contains`.',
    ],
    walkthrough: `**How to think about it.** \`&dyn Plugin\` fails because callers through a trait object would have to know \`Extra\`. So design a trait whose methods never mention \`Extra\`: \`compile\` takes text and returns text, the same types for every plugin. Then connect the two traits once, for every plugin, with a *blanket impl* (an \`impl\` that is generic over the type it implements for). Inside it, \`Extra\` is known again, because each copy is made for one concrete plugin.

**The solution, line by line.**

- \`impl<P: Plugin> AnyPlugin for P {\` says: for any type \`P\` that implements \`Plugin\`, here is its \`AnyPlugin\` impl. The compiler makes one copy for \`Js\` and one for \`Py\`, as it does for \`compile<P: LanguagePlugin>\`.
- \`fn handles(&self, file: &str) -> bool {\` asks whether this plugin takes the file.
- \`self.exts().iter().any(|e| file.ends_with(e))\` calls the \`Plugin\` method \`exts\` on \`self\` (allowed, because \`P: Plugin\`), walks the extensions, and is true as soon as one is at the end of the file name.
- \`fn compile(&self, src: &str) -> String {\` is the dyn-friendly entry point.
- \`let x = self.lower(src);\` keeps the plugin's private data in a local. Its type is \`P::Extra\`: \`usize\` in the copy for \`Js\`, \`String\` in the copy for \`Py\`.
- \`self.emit(src, &x)\` hands it straight to the same plugin's \`emit\` and returns the \`String\`. \`x\` is dropped at the closing brace, so \`Extra\` never escapes.
- In \`pick\`, \`let all: [&dyn AnyPlugin; 2] = [&Js, &Py];\` builds a fixed-size array of trait objects; this type compiles because \`AnyPlugin\` has no associated type.
- \`all.into_iter().find(|p| p.handles(file))\` returns the first plugin that handles the file, or \`None\`. \`&Js\` and \`&Py\` borrow constants that live for the whole program, which is what \`&'static dyn AnyPlugin\` asks for.

**Common wrong attempts.**

- Using \`contains\` instead of \`ends_with\` matches an extension anywhere in the name, so \`notes.json\` (which contains \`.js\`) goes to the JavaScript plugin.
- Falling back to JavaScript for every other file is what the TypeScript CLI does, but this \`pick\` must return \`None\` for \`c.rb\`.

The cost of the erased version is one indirect call per method, through the trait object's table of functions (*Trait objects and dispatch*); for a compiler that makes one such call per file, that is nothing.`,
    wrong: [
      {
        code: `${BASE}

${IMPL_HEAD}
    fn handles(&self, file: &str)
        -> bool {
        self.exts()
            .iter()
            .any(|e| file.contains(e))
    }
${GOOD_COMPILE}
}

${GOOD_PICK}`,
        why: '`contains` matches an extension anywhere in the name, so `notes.json` (which contains `.js`) is handed to the JavaScript plugin. Extensions belong at the end: `ends_with`.',
      },
      {
        code: `${BASE}

${IMPL_HEAD}
    fn handles(&self, file: &str)
        -> bool {
        self.exts()
            .iter()
            .any(|e| file.ends_with(e))
    }
${GOOD_COMPILE}
}

${PICK_SIG}
    if Py.handles(file) {
        Some(&Py)
    } else {
        Some(&Js)
    }
}`,
        why: 'Falling back to JavaScript for every other file is what the TypeScript CLI does, but this `pick` must return `None` when no plugin handles the file, as for `c.rb`.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'What does the associated type `Extra` replace in the TypeScript plugin design?',
    options: [
      { t: 'The `id` string', why: '`id` is still there, as `fn id(&self) -> &\'static str`.' },
      { t: 'The bigger lowered object that `emit` casts back with `as JsLowered`', correct: true, why: 'The plugin’s private data now has a type of its own, and `emit` takes exactly that type.' },
      { t: 'The `Plan`', why: 'The plan comes from the core and is the same type for every plugin.' },
      { t: 'The VIR module', why: 'Every plugin produces the same `Module` type; that is what the core reads.' },
    ],
  },
  {
    q: 'Why does `compile` return the same type, `Result<CompileResult, CompileError>`, for every plugin?',
    options: [
      { t: 'Because `compile` takes `&dyn LanguagePlugin`', why: 'It takes a generic `&P`; `&dyn LanguagePlugin` doesn’t even compile.' },
      { t: 'Because `CompileResult` stores `Extra` as `Box<dyn Any>`', why: 'It doesn’t store `Extra` at all.' },
      { t: 'Because nothing in `CompileResult` mentions `Extra`: it is used and dropped inside `compile`', correct: true, why: 'So the branch in the CLI has one type, whichever plugin ran.' },
    ],
  },
  {
    q: 'What does rustc say about `let ps: Vec<&dyn LanguagePlugin> = vec![&JsPlugin, &PyPlugin];`?',
    options: [
      { t: 'E0191: the value of the associated type `Extra` must be specified', correct: true, why: 'A trait object type has to name every associated type.' },
      { t: 'E0038: the trait is not dyn compatible', why: 'It is dyn compatible; `&dyn LanguagePlugin<Extra = JsExtra>` compiles.' },
      { t: 'It compiles', why: 'Not without naming `Extra`, and then only one of the two plugins fits.' },
      { t: 'E0277: `JsPlugin` doesn’t implement `LanguagePlugin`', why: 'It does; the problem is the trait-object type.' },
    ],
  },
  {
    q: 'You write `Vec<&dyn LanguagePlugin<Extra = JsExtra>>` and put `&JsPlugin` and `&PyPlugin` in it. Which part fails?',
    options: [
      { t: 'Both, with E0191', why: 'Naming `Extra` fixes E0191.' },
      { t: 'Only `&PyPlugin`: its `Extra` is `PyExtra`, not `JsExtra` (E0271)', correct: true, why: 'Each choice of `Extra` is a different trait-object type.' },
      { t: 'Only `&JsPlugin`', why: '`JsPlugin`’s `Extra` is `JsExtra`, so it fits.' },
    ],
  },
  {
    q: 'In the exercise, why is `AnyPlugin` usable as `&dyn AnyPlugin` when `Plugin` isn’t?',
    options: [
      { t: 'Its methods mention no associated type: `compile` returns a `String` for every plugin', correct: true, why: 'The `Extra` stays inside the blanket impl’s copy for each plugin.' },
      { t: 'Because it has fewer methods', why: 'The number of methods doesn’t matter.' },
      { t: 'Because blanket impls make any trait dyn compatible', why: 'The blanket impl connects the traits; it is `AnyPlugin`’s own signatures that make it a usable trait object.' },
    ],
  },
];
