// Chapter 260: one Compiler struct, handed down the chain of calls as
// &mut self, while drip-rs compiles `fn f() { print 1; }`. The calls and
// the order of emitted bytes follow book/companion/rust/src/compiler.rs
// (declaration -> fn_declaration -> function -> block -> ...); the final
// chunks match the real listings: f = CONSTANT '1', PRINT, NIL, RETURN;
// script = CLOSURE <fn f>, DEFINE_GLOBAL 'f', NIL, RETURN.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

type S = { calls: string[]; fns: { name: string; code: string[] }[]; note: string; done?: boolean };

const STATES: S[] = [
  { calls: ['compile'], fns: [{ name: 'script', code: [] }], note: 'compile() builds one Compiler on its own stack. It borrows the source (for tokens) and, from the caller, the heap and the error list. begin_function(Script) pushes the first FunctionState.' },
  { calls: ['compile', 'declaration', 'fn_declaration'], fns: [{ name: 'script', code: [] }], note: 'Each call passes the same &mut self down. While fn_declaration runs, declaration’s borrow is lent out: only the innermost call can use the compiler. parse_variable interns "f" as a constant of the script.' },
  { calls: ['compile', 'declaration', 'fn_declaration', 'function'], fns: [{ name: 'script', code: [] }, { name: 'f', code: [] }], note: 'function() calls begin_function, which pushes a new FunctionState. The innermost function being compiled is always functions.last(). TypeScript linked these with `enclosing`; drip-rs uses a Vec as a stack.' },
  { calls: ['compile', '…', 'function', 'block', 'statement', 'expression', 'parse_precedence', 'number', 'emit_constant'], fns: [{ name: 'script', code: [] }, { name: 'f', code: ["CONSTANT '1'"] }], note: 'Nine calls deep, emit_constant still has the one &mut Compiler. self.chunk() returns &mut functions.last().chunk, so the byte lands in f’s chunk, not the script’s.' },
  { calls: ['compile', '…', 'function', 'block', 'statement'], fns: [{ name: 'script', code: [] }, { name: 'f', code: ["CONSTANT '1'", 'PRINT'] }], note: 'The calls return, and each caller gets its borrow back. statement emits PRINT after its expression.' },
  { calls: ['compile', 'declaration', 'fn_declaration', 'function'], fns: [{ name: 'script', code: ["CLOSURE <fn f>"] }], note: 'end_function emits NIL, RETURN into f, pops f’s FunctionState and moves its chunk into the heap’s ObjFunction, as an Rc<Chunk>. Now functions.last() is the script again, so CLOSURE goes there.' },
  { calls: ['compile'], fns: [{ name: 'script', code: ['CLOSURE <fn f>', "DEFINE_GLOBAL 'f'"] }], note: 'fn_declaration finishes with DEFINE_GLOBAL. Back in compile, the loop ends at Eof.' },
  { calls: [], fns: [], done: true, note: 'compile calls end_function for the script (NIL, RETURN) and returns Some(function), or None if had_error. The Compiler goes out of scope and is dropped, which ends its borrows of the heap and the error list. The caller can use both again.' },
];

export default function CompilerSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="One compiler, passed down as &mut self" steps={s} note={st.note}>
      <Svg w={400} h={262} title="The call chain on the left; the Compiler's stack of functions and their bytecode on the right">
        <T x={8} y={10} size={10} weight={700} fill={tok('muted')}>CALLS (innermost holds &amp;mut)</T>
        {st.calls.map((c, k) => {
          const inner = k === st.calls.length - 1;
          return (
            <Box key={k} x={8} y={20 + k * 24} w={150} h={20} r={3}
              fill={inner ? tok('brand', 0.18) : tok('panel')} stroke={inner ? tok('brand') : tok('line')}>
              <T x={14} y={30 + k * 24} size={11} mono fill={inner ? tok('ink') : tok('muted')}>{c}</T>
            </Box>
          );
        })}
        {st.calls.length > 0 && (
          <Arrow x1={160} y1={30 + (st.calls.length - 1) * 24} x2={196} y2={34} color={tok('brand')} bend={0.3} />
        )}
        <Box x={200} y={20} w={192} h={st.done ? 70 : 228} r={4} fill={tok('panel')} stroke={st.done ? tok('line') : tok('ink', 0.5)} dash={st.done}>
          <T x={208} y={34} size={11} mono weight={700}>Compiler</T>
          <T x={208} y={52} size={10} mono fill={tok('muted')}>heap: &amp;'a mut Heap</T>
          <T x={208} y={66} size={10} mono fill={tok('muted')}>errors: &amp;'a mut Vec</T>
          {st.done && <T x={208} y={80} size={10} fill={tok('danger')}>dropped: borrows end</T>}
          {!st.done && <T x={208} y={84} size={10} mono weight={700} fill={tok('muted')}>functions:</T>}
          {st.fns.map((f, k) => {
            const y = 94 + k * 76;
            const top = k === st.fns.length - 1;
            return (
              <g key={f.name}>
                <Box x={208} y={y} w={176} h={70} r={3} fill={top ? tok('accent', 0.1) : tok('panel')} stroke={top ? tok('accent') : tok('line')}>
                  <T x={214} y={y + 11} size={10} mono weight={700}>[{k}] {f.name}{top ? '  ← last()' : ''}</T>
                  {f.code.map((b, j) => (
                    <T key={j} x={218} y={y + 27 + j * 13} size={10} mono fill={tok('safe')}>{b}</T>
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
