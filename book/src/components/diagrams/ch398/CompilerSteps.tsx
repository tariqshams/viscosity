// Chapter 398: one Compiler struct, handed down a chain of calls as
// &mut self, while drip-rs compiles `fn f() { print 1; }`. The calls and
// the order of the emitted bytes follow book/companion/rust/src/
// compiler.rs (declaration -> fn_declaration -> fn_rest -> braced_block
// -> block -> ... -> prefix(Number)); the final chunks match
// `drip-rs --disassemble`: f = const '1', print, none, return; script =
// closure fn f, define.global 'f', none, return.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

type S = { calls: string[]; fns: { name: string; code: string[] }[]; note: string; done?: boolean };

const STATES: S[] = [
  { calls: ['compile'], fns: [{ name: 'script', code: [] }], note: 'compile builds one Compiler on its own stack, borrowing the source and the caller’s heap and roots. begin_function(Script) pushes the first FunctionState.' },
  { calls: ['compile', 'declaration', 'fn_declaration'], fns: [{ name: 'script', code: [] }], note: 'Each call passes the same &mut self down. While fn_declaration runs, declaration has lent its borrow away: only the innermost call can use the compiler.' },
  { calls: ['compile', 'declaration', 'fn_declaration', 'fn_rest', 'begin_function'], fns: [{ name: 'script', code: [] }, { name: 'f', code: [] }], note: 'begin_function allocates f’s ObjFunction in the heap and pushes a new FunctionState. The function being compiled is always functions.last(); TypeScript linked these with enclosing.' },
  { calls: ['compile', '…', 'fn_rest', 'braced_block', 'block', 'statement', 'expression', 'parse_precedence', 'prefix(Number)'], fns: [{ name: 'script', code: [] }, { name: 'f', code: ["const '1'"] }], note: 'Many calls deep, prefix(Number) still has the one &mut Compiler. self.chunk() is &mut functions.last().chunk, so the byte lands in f’s chunk, not the script’s.' },
  { calls: ['compile', '…', 'fn_rest', 'braced_block', 'block', 'statement'], fns: [{ name: 'script', code: [] }, { name: 'f', code: ["const '1'", 'print'] }], note: 'The calls return, and each caller gets its borrow back. statement consumes the ; and emits print.' },
  { calls: ['compile', 'declaration', 'fn_declaration', 'fn_rest'], fns: [{ name: 'script', code: ['closure fn f'] }], note: 'end_function emits none, return into f, pops f’s state, and moves its chunk into the heap as an Rc<Chunk>. functions.last() is the script again, so closure goes there.' },
  { calls: ['compile'], fns: [{ name: 'script', code: ['closure fn f', "define.global 'f'"] }], note: 'fn_declaration finishes with define_variable, which emits define.global, because f is a global. Back in compile, the loop ends at the end of the file.' },
  { calls: [], fns: [], done: true, note: 'compile ends the script (none, return) and returns Some(function), as no errors were found. The Compiler is dropped, which ends its borrows: the caller can use its heap again.' },
];

export default function CompilerSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="One compiler, passed down as &mut self" steps={s} note={st.note}>
      <Svg w={400} h={290} title="The call chain on the left; the Compiler's stack of functions and their bytecode on the right">
        <T x={8} y={10} size={11} weight={700} fill={tok('muted')}>CALLS (innermost holds &amp;mut)</T>
        {st.calls.map((c, k) => {
          const inner = k === st.calls.length - 1;
          return (
            <Box key={k} x={8} y={22 + k * 28} w={164} h={24} r={3}
              fill={inner ? tok('brand', 0.18) : tok('panel')} stroke={inner ? tok('brand') : tok('line')}>
              <T x={14} y={34 + k * 28} size={12} mono fill={inner ? tok('ink') : tok('muted')}>{c}</T>
            </Box>
          );
        })}
        {st.calls.length > 0 && (
          <Arrow x1={174} y1={34 + (st.calls.length - 1) * 28} x2={198} y2={36} color={tok('brand')} bend={0.3} />
        )}
        <Box x={200} y={20} w={192} h={st.done ? 74 : 262} r={4} fill={tok('panel')} stroke={st.done ? tok('line') : tok('ink', 0.5)} dash={st.done}>
          <T x={208} y={36} size={12} mono weight={700}>Compiler</T>
          <T x={208} y={54} size={11} mono fill={tok('muted')}>heap: &amp;'a mut Heap</T>
          <T x={208} y={70} size={11} mono fill={tok('muted')}>roots: &amp;'a dyn Trace</T>
          {st.done && <T x={208} y={86} size={11} fill={tok('danger')}>dropped: borrows end</T>}
          {!st.done && <T x={208} y={90} size={11} mono weight={700} fill={tok('muted')}>functions:</T>}
          {st.fns.map((f, k) => {
            const y = 100 + k * 88;
            const top = k === st.fns.length - 1;
            return (
              <g key={f.name}>
                <Box x={208} y={y} w={176} h={80} r={3} fill={top ? tok('accent', 0.1) : tok('panel')} stroke={top ? tok('accent') : tok('line')}>
                  <T x={214} y={y + 13} size={11} mono weight={700}>[{k}] {f.name}{top ? '  ← last()' : ''}</T>
                  {f.code.map((b, j) => (
                    <T key={j} x={218} y={y + 32 + j * 16} size={11} mono fill={tok('safe')}>{b}</T>
                  ))}
                </Box>
              </g>
            );
          })}
        </Box>
      </Svg>
    </StepFrame>
  );
}
