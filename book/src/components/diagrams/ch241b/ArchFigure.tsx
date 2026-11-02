// How clang and rustc are put together around LLVM. clang's libraries from
// the Clang Internals Manual (Lexer/Preprocessor, Parser, Sema, AST,
// CodeGen); rustc's IRs from the rustc-dev-guide overview (AST, HIR, THIR,
// MIR, then LLVM IR, with Cranelift and GCC as other back ends); LLVM's
// stages from the LLVM code generator documentation.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

function Col({ x, y0 = 0, title, rows, color }: { x: number; y0?: number; title: string; rows: string[]; color: string }) {
  return (
    <g>
      <T x={x + 85} y={y0 + 12} size={12} weight={700} anchor="middle">{title}</T>
      {rows.map((r, k) => (
        <g key={k}>
          <Box x={x} y={y0 + 22 + k * 34} w={170} h={26} fill={tok(color, 0.16)} stroke={tok(color)}>
            <T x={x + 85} y={y0 + 35 + k * 34} size={11.5} anchor="middle">{r}</T>
          </Box>
          {k < rows.length - 1 && <Arrow x1={x + 85} y1={y0 + 48 + k * 34} x2={x + 85} y2={y0 + 56 + k * 34} width={1.5} />}
        </g>
      ))}
    </g>
  );
}

export default function ArchFigure() {
  return (
    <Svg w={400} h={412} title="clang and rustc each turn source into LLVM IR in their own stages; LLVM then optimises and generates machine code. rustc can also use Cranelift or GCC instead of LLVM.">
      <Col x={8} title="clang (C, C++)" color="f1" rows={['driver: -ccc-print-phases', 'lexer + preprocessor', 'parser ⇄ Sema', 'AST (typed, checked)', 'CodeGen → LLVM IR']} />
      <Col x={222} title="rustc (Rust)" color="f2" rows={['lexer + parser → AST', 'HIR (desugared)', 'THIR (fully typed)', 'MIR (a CFG; borrow check)', 'codegen → LLVM IR']} />
      <Arrow x1={93} y1={184} x2={170} y2={240} />
      <Arrow x1={307} y1={184} x2={230} y2={240} />
      <T x={330} y={204} size={11} fill={tok('muted')}>or Cranelift,</T>
      <T x={330} y={218} size={11} fill={tok('muted')}>or GCC</T>
      <Col x={115} y0={222} title="LLVM" color="f3" rows={['opt: IR passes (-O2)', 'SelectionDAG or GlobalISel', 'scheduling, register alloc.', 'prologue/epilogue, MC', 'object file (ELF)']} />
    </Svg>
  );
}
