// Chapter 146: the two ways a Drip program fails in drip-rs, and where
// each ends up. Follows compile() in book/companion/rust/src/compiler.rs
// (syntax_errors and static_errors, panic mode), Vm::interpret and
// Vm::runtime_error in vm.rs, and main.rs (the exit codes 65 and 70, and
// 64 and 66 before anything is compiled).
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

function Step({ x, y, w, title, sub, col }: { x: number; y: number; w: number; title: string; sub: string; col: string }) {
  return (
    <Box x={x} y={y} w={w} h={44} r={5} fill={tok(col, 0.12)} stroke={tok(col)}>
      <T x={x + 8} y={y + 15} size={12} weight={700}>{title}</T>
      <T x={x + 8} y={y + 32} size={11} mono fill={tok('muted')}>{sub}</T>
    </Box>
  );
}

export default function TwoPaths() {
  return (
    <Svg w={400} h={300} title="Compile errors collect in two Vecs and end as exit 65; a runtime error returns Err through ? and ends as exit 70">
      <Step x={4} y={4} w={392} title="main.rs reads the file" sub="no file: exit 66 · bad usage: exit 64" col="muted" />
      <Arrow x1={100} y1={48} x2={100} y2={68} />
      <Arrow x1={300} y1={48} x2={300} y2={68} />
      <T x={100} y={78} size={11} weight={700} anchor="middle" fill={tok('warn')}>while compiling</T>
      <T x={300} y={78} size={11} weight={700} anchor="middle" fill={tok('danger')}>while running</T>
      <Step x={4} y={90} w={192} title="error_at / static_error" sub="push a String, go on" col="warn" />
      <Step x={204} y={90} w={192} title="runtime_error" sub="message + trace" col="danger" />
      <Arrow x1={100} y1={134} x2={100} y2={154} />
      <Arrow x1={300} y1={134} x2={300} y2={154} />
      <Step x={4} y={156} w={192} title="syntax first" sub="else the static ones" col="warn" />
      <Step x={204} y={156} w={192} title="Err(RuntimeError)" sub="? carries it out" col="danger" />
      <Arrow x1={100} y1={200} x2={100} y2={220} />
      <Arrow x1={300} y1={200} x2={300} y2={220} />
      <Step x={4} y={222} w={192} title="compile → None" sub="exit_code 65" col="warn" />
      <Step x={204} y={222} w={192} title="interpret cleans up" sub="exit_code 70" col="danger" />
      <T x={4} y={288} size={11} fill={tok('muted')}>Both paths only fill Vec&lt;String&gt;s; main prints them to stderr.</T>
    </Svg>
  );
}
