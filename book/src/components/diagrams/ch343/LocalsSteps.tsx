// Chapter 343: drip-rs's compile-time locals while it compiles
//   { let a = 1; { let b = a + 2; print b; } }
// The bytes are the real `drip-rs --disassemble` listing for that program
// (identical to the TypeScript VM's). The locals follow compiler.rs:
// begin_function puts "" at slot 0 with depth Some(0); add_local pushes
// depth None; define_variable -> mark_initialized sets Some(scope_depth);
// end_scope pops every local deeper than the new depth, emitting pop.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

type L = { name: string; depth: string };
type S = { src: string; depth: number; locals: L[]; code: string[]; fresh: number; hot?: number; note: string };

const Z: L = { name: '""', depth: 'Some(0)' };

const STATES: S[] = [
  { src: '{', depth: 1, locals: [Z], code: [], fresh: 0, note: 'The script’s FunctionState starts with one local, slot 0, reserved for the function being run. begin_scope raises scope_depth to 1. No bytecode yet.' },
  { src: 'let a = 1;', depth: 1, locals: [Z, { name: 'a', depth: 'None' }], code: ["const 0 '1'"], fresh: 1, hot: 1, note: 'declare_variable pushes a with depth None, so it exists but can’t be read yet. Then the initializer is compiled: const puts 1 on the stack, which is exactly slot 1.' },
  { src: 'let a = 1;', depth: 1, locals: [Z, { name: 'a', depth: 'Some(1)' }], code: ["const 0 '1'"], fresh: 0, hot: 1, note: 'define_variable calls mark_initialized: depth becomes Some(1). Notice that no instruction “defines” a. Its value is already in its slot.' },
  { src: '{ let b = a + 2;', depth: 2, locals: [Z, { name: 'a', depth: 'Some(1)' }, { name: 'b', depth: 'Some(2)' }], code: ["const 0 '1'", 'load.local 1', "const 1 '2'", 'add'], fresh: 3, hot: 1, note: 'Inside the inner block, depth is 2. b is pushed (None), then `a` is resolved by searching from the end: b doesn’t match, a does, at index 1. load.local 1. After add, b is marked Some(2).' },
  { src: 'print b;', depth: 2, locals: [Z, { name: 'a', depth: 'Some(1)' }, { name: 'b', depth: 'Some(2)' }], code: ["const 0 '1'", 'load.local 1', "const 1 '2'", 'add', 'load.local 2', 'print'], fresh: 2, hot: 2, note: 'b resolves to index 2, its stack slot. The names a and b exist only here, in the compiler’s Vec; the bytecode has just the numbers.' },
  { src: '}', depth: 1, locals: [Z, { name: 'a', depth: 'Some(1)' }], code: ["const 0 '1'", 'load.local 1', "const 1 '2'", 'add', 'load.local 2', 'print', 'pop'], fresh: 1, note: 'end_scope lowers depth to 1. The last local, b, has depth 2 > 1: read is_captured (false), pop it, and only then emit pop. a has depth 1, which isn’t deeper, so the loop stops.' },
  { src: '}', depth: 0, locals: [Z], code: ["const 0 '1'", 'load.local 1', "const 1 '2'", 'add', 'load.local 2', 'print', 'pop', 'pop'], fresh: 1, note: 'The outer block ends: a (depth 1 > 0) is popped, with a pop. Slot 0 has depth Some(0), so it stays. Finally the script ends with none, return.' },
];

export default function LocalsSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Compiling two blocks: the locals Vec" steps={s} note={st.note}>
      <Svg w={400} h={232} title="The compiler's locals, each with its scope depth, beside the bytecode emitted so far">
        <T x={8} y={12} size={12} mono weight={700}>{st.src}</T>
        <T x={196} y={12} size={11} mono anchor="end" fill={tok('muted')}>scope_depth = {st.depth}</T>
        <T x={8} y={34} size={11} mono weight={700} fill={tok('muted')}>locals: Vec&lt;Local&gt;</T>
        {st.locals.map((l, i) => {
          const hot = st.hot === i;
          const pending = l.depth === 'None';
          return (
            <Box key={i} x={8} y={44 + i * 34} w={188} h={28} r={3}
              fill={hot ? tok('brand', 0.16) : tok('panel')} stroke={hot ? tok('brand') : pending ? tok('accent') : tok('line')} dash={pending}>
              <T x={16} y={58 + i * 34} size={11} mono fill={tok('muted')}>{i}</T>
              <T x={34} y={58 + i * 34} size={11} mono weight={700}>{l.name}</T>
              <T x={188} y={58 + i * 34} size={11} mono anchor="end" fill={pending ? tok('accent') : tok('muted')}>depth {l.depth}</T>
            </Box>
          );
        })}
        <T x={8} y={210} size={11} fill={tok('muted')}>index in the Vec = stack slot</T>
        <T x={212} y={34} size={11} mono weight={700} fill={tok('muted')}>chunk.code</T>
        <Box x={212} y={44} w={180} h={176} r={4} fill={tok('panel')} stroke={tok('line')}>
          {st.code.map((c, j) => {
            const isNew = j >= st.code.length - st.fresh;
            return (
              <T key={j} x={222} y={58 + j * 20} size={11} mono fill={isNew ? tok('safe') : tok('muted')} weight={isNew ? 700 : undefined}>{c}</T>
            );
          })}
        </Box>
      </Svg>
    </StepFrame>
  );
}
