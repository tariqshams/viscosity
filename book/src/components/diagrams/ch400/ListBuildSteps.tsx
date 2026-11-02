// Chapter 400: drip-rs's `list` instruction (OpCode::List in
// book/companion/rust/src/vm.rs) building `[1, "a"]`. The bytecode is
// what `drip-rs --disassemble` prints for `let xs = [1, "a"];`: const '1',
// const 'a', list 2, define.global 'xs'. Slot 0 of the stack holds the
// running script's closure. The order of to_vec, alloc and truncate is
// the real one: the elements stay on the stack while alloc may collect.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

type S = { line: string; stack: string[]; items: string[] | null; arena: string | null; gc?: boolean; note: string };

const STATES: S[] = [
  { line: 'const 1, const "a"', stack: ['closure', '1', '"a"'], items: null, arena: null, note: 'The compiler emitted each element in order, so the two values sit on top of the stack, the 1 under the "a". Next comes list 2.' },
  { line: 'let n = self.read_byte() as usize;', stack: ['closure', '1', '"a"'], items: null, arena: null, note: 'The operand byte says how many elements to take: n = 2, so start = stack.len() - 2, which is 1.' },
  { line: 'let items = self.stack[start..].to_vec();', stack: ['closure', '1', '"a"'], items: ['1', '"a"'], arena: null, note: 'to_vec copies the slice into a brand-new Vec, in order. The copy is a local variable of this match arm: no root the collector knows about points to it.' },
  { line: 'let list = self.alloc(ObjList { items });', stack: ['closure', '1', '"a"'], items: null, arena: '0: [1, "a"]', gc: true, note: 'alloc may collect first. The string "a" survives, because the stack still holds it and the stack is a root. Then the ObjList moves into slot 0 of the lists arena.' },
  { line: 'self.stack.truncate(start);', stack: ['closure'], items: null, arena: '0: [1, "a"]', note: 'Only now are the elements dropped from the stack; the list in the arena keeps the string alive from here on.' },
  { line: 'self.push(Value::List(list));', stack: ['closure', 'List(Gc 0)'], items: null, arena: '0: [1, "a"]', note: 'One value is left where two were: a handle to the new list. define.global then stores it under the name xs.' },
];

export default function ListBuildSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="list 2: build, allocate, then truncate" steps={s} note={st.note}>
      <Svg w={400} h={236} title="The VM stack, the temporary Vec, and the lists arena while list 2 runs">
        <Box x={8} y={6} w={384} h={28} r={4} fill={tok('panel')} stroke={tok('line')}>
          <T x={16} y={20} size={11} mono weight={700}>{st.line}</T>
        </Box>
        <T x={8} y={52} size={11} weight={700} fill={tok('muted')}>STACK (a root)</T>
        {st.stack.map((v, k) => (
          <Box key={k} x={8} y={196 - k * 34} w={110} h={28} r={3}
            fill={v.startsWith('List') ? tok('accent', 0.16) : tok('brand', 0.1)} stroke={v.startsWith('List') ? tok('accent') : tok('brand')}>
            <T x={63} y={210 - k * 34} size={12} mono anchor="middle">{v}</T>
          </Box>
        ))}
        <T x={142} y={52} size={11} weight={700} fill={tok('muted')}>LOCAL items: Vec</T>
        {st.items ? st.items.map((v, k) => (
          <Box key={k} x={142 + k * 50} y={62} w={46} h={28} r={3} fill={tok('warn', 0.14)} stroke={tok('warn')}>
            <T x={165 + k * 50} y={76} size={12} mono anchor="middle">{v}</T>
          </Box>
        )) : <T x={142} y={76} size={11} fill={tok('muted')}>(none)</T>}
        <T x={142} y={118} size={11} weight={700} fill={tok('muted')}>HEAP: lists arena</T>
        <Box x={142} y={128} w={170} h={30} r={3} dash={!st.arena}
          fill={st.arena ? tok('safe', 0.12) : tok('panel')} stroke={st.arena ? tok('safe') : tok('line')}>
          <T x={150} y={143} size={12} mono fill={st.arena ? tok('ink') : tok('muted')}>{st.arena ?? 'empty'}</T>
        </Box>
        {st.gc && <T x={142} y={180} size={11} fill={tok('danger')}>a collection may run here</T>}
      </Svg>
    </StepFrame>
  );
}
