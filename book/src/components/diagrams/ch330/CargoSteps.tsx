// Chapter 330: what each everyday cargo command does to a project. A
// terminal on top shows the command and its real output (cargo 1.97.0,
// run in the writing session, paths trimmed); the file tree below grows
// as the commands create files. New files are highlighted.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

type F = { path: string; depth: number; dir?: boolean; fresh?: boolean; note?: string };
type S = { cmd: string; out: string[]; files: F[]; note: string };

const base: F[] = [
  { path: 'hello/', depth: 0, dir: true },
  { path: 'Cargo.toml', depth: 1, note: 'the manifest' },
  { path: 'src/', depth: 1, dir: true },
  { path: 'main.rs', depth: 2, note: 'fn main()' },
  { path: '.gitignore', depth: 1, note: 'ignores target/' },
];
const lock: F = { path: 'Cargo.lock', depth: 1, note: 'exact versions' };
const tgt: F = { path: 'target/', depth: 1, dir: true };
const dbg: F = { path: 'debug/hello', depth: 2, note: 'the program' };
const rel: F = { path: 'release/hello', depth: 2, note: 'optimised' };
const mark = (f: F): F => ({ ...f, fresh: true });

const STATES: S[] = [
  { cmd: '', out: [], files: [], note: 'An empty folder. Each step runs one cargo command; watch which files appear. (The output is real, from cargo 1.97, with the folder paths left out.)' },
  { cmd: 'cargo new hello', out: ['Creating binary (application) `hello`', 'package'], files: base.map(mark), note: 'cargo new makes a folder holding a manifest, Cargo.toml, and one source file, src/main.rs, already containing a hello-world main. It also starts a git repository, with a .gitignore that leaves out target/.' },
  { cmd: 'cargo check', out: ['Checking hello v0.1.0', 'Finished `dev` profile [unoptimized +', 'debuginfo] target(s) in 0.10s'], files: [...base, mark(lock), mark(tgt)], note: 'cargo check runs every check the compiler has (types, borrowing, everything) but stops before making a program. It is the fast one; you will run it all day. Cargo.lock records the exact version of every dependency.' },
  { cmd: 'cargo build', out: ['Compiling hello v0.1.0', 'Finished `dev` profile [unoptimized +', 'debuginfo] target(s) in 0.11s'], files: [...base, lock, tgt, mark(dbg)], note: 'cargo build goes all the way: it writes a real program, target/debug/hello, that runs without cargo, without rustc and without Rust installed. dev means a debug build: quick to compile, not optimised.' },
  { cmd: 'cargo run', out: ['Finished `dev` profile [...]', 'Running `target/debug/hello`', 'Hello, world!'], files: [...base, lock, tgt, dbg], note: 'cargo run builds if anything changed (here nothing had, so it only says Finished), then runs the program. Hello, world! is the program’s own output; the lines above it are cargo’s.' },
  { cmd: 'cargo build --release', out: ['Compiling hello v0.1.0', 'Finished `release` profile [optimized]', 'target(s) in 0.09s'], files: [...base, lock, tgt, dbg, mark(rel)], note: 'With --release the optimiser is on, and the program lands in target/release/. Compiling takes longer on a real project, and the program can run many times faster. Measure only release builds.' },
];

export default function CargoSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const rowH = 17;
  return (
    <StepFrame title="Four cargo commands, one project" steps={s} note={st.note}>
      <Svg w={400} h={272} title="A terminal running cargo commands, and the project's files">
        <Box x={4} y={4} w={392} h={84} fill={tok('ink', 0.06)} stroke={tok('line')}>
          <T x={14} y={20} size={12} mono weight={700} fill={tok('brand')}>{st.cmd ? `$ ${st.cmd}` : '$'}</T>
          {st.out.map((l, k) => (
            <T key={k} x={14} y={39 + k * 16} size={11} mono fill={l === 'Hello, world!' ? tok('ink') : tok('muted')} weight={l === 'Hello, world!' ? 700 : 400}>{l}</T>
          ))}
        </Box>
        <T x={8} y={104} size={11} weight={700} fill={tok('muted')}>FILES</T>
        {st.files.length === 0 && <T x={200} y={170} size={12} anchor="middle" fill={tok('muted')}>(nothing yet)</T>}
        {st.files.map((f, k) => {
          const y = 122 + k * rowH;
          const x = 14 + f.depth * 18;
          return (
            <g key={f.path}>
              {f.fresh && <rect x={x - 5} y={y - 8} width={190 - f.depth * 18} height={16} rx={3} fill={tok('brand', 0.15)} />}
              <T x={x} y={y} size={12} mono weight={f.dir ? 700 : 400}>{f.path}</T>
              {f.note && <T x={226} y={y} size={11} fill={tok('muted')}>{f.note}</T>}
            </g>
          );
        })}
      </Svg>
    </StepFrame>
  );
}
