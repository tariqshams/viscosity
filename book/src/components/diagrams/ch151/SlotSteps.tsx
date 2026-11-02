// Chapter 151: the compiler's locals array beside the VM's stack.
import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const CODE = `{
  let a = 1;
  {
    let b = a + 2;
    print b;
  }
  a = 5;
  print a;
}`;

/** A compile-time local: its name and depth (-1 = declared, not ready). */
type L = [string, number];
type S = {
  line: number;
  depth: number;
  locals: L[];
  stack: string[];
  emit: string;
  hot?: number;
  out?: string;
  note: string;
};

// The compiler names slot 0 '' (the script itself); shown as (script).
const SLOT0: L = ['(script)', 0];

const STATES: S[] = [
  { line: -1, depth: 0, locals: [SLOT0], stack: ['script'], emit: '', note: 'Before anything: the compiler’s locals array already has one entry, for slot 0, which holds the running script at run time. scopeDepth is 0: the top level, where let makes globals.' },
  { line: 0, depth: 1, locals: [SLOT0], stack: ['script'], emit: '(nothing)', note: 'The { calls beginScope, which only adds 1 to scopeDepth. No instruction is emitted: entering a block costs nothing at run time.' },
  { line: 1, depth: 1, locals: [SLOT0, ['a', -1]], stack: ['script', '1'], emit: 'const 1', hot: 1, note: 'let a: scopeDepth is above 0, so a is a local. addLocal appends it with depth -1 ("not ready yet"), and then the initialiser is compiled. At run time the 1 lands in the next free slot, slot 1.' },
  { line: 1, depth: 1, locals: [SLOT0, ['a', 1]], stack: ['script', '1'], emit: '(nothing)', hot: 1, note: 'markInitialized sets a’s depth to 1, and that is all: the value is already where a lives. a’s index in the locals array, 1, IS its stack slot.' },
  { line: 2, depth: 2, locals: [SLOT0, ['a', 1]], stack: ['script', '1'], emit: '(nothing)', note: 'An inner block: scopeDepth becomes 2.' },
  { line: 3, depth: 2, locals: [SLOT0, ['a', 1], ['b', 2]], stack: ['script', '1', '3'], emit: 'load.local 1  const 2  add', hot: 2, note: 'let b = a + 2. To compile a, resolveLocal searches the locals array from the END: b does not match, a does, at index 1, so a becomes load.local 1. The sum lands in slot 2, which is b.' },
  { line: 4, depth: 2, locals: [SLOT0, ['a', 1], ['b', 2]], stack: ['script', '1', '3'], emit: 'load.local 2  print', hot: 2, out: '3', note: 'print b: b is found at index 2, so the compiler emits load.local 2, then print.' },
  { line: 5, depth: 1, locals: [SLOT0, ['a', 1]], stack: ['script', '1'], emit: 'pop', out: '3', note: 'The inner } calls endScope: scopeDepth drops to 1, and every local deeper than that (only b) is removed from the array, with one pop each. At run time that pop frees slot 2.' },
  { line: 6, depth: 1, locals: [SLOT0, ['a', 1]], stack: ['script', '5'], emit: 'const 5  store.local 1  pop', hot: 1, out: '3', note: 'a = 5 becomes store.local 1: write the top of the stack into slot 1. The statement’s pop then drops the leftover copy.' },
  { line: 7, depth: 1, locals: [SLOT0, ['a', 1]], stack: ['script', '5'], emit: 'load.local 1  print', hot: 1, out: '3 5', note: 'print a resolves a to index 1 once more. The name is used here, at compile time, and never again.' },
  { line: 8, depth: 0, locals: [SLOT0], stack: ['script'], emit: 'pop', out: '3 5', note: 'The outer } removes a, with one more pop. The compiler’s array and the VM’s stack have moved in step the whole time: that is compile-time scope.' },
];

const RH = 30;
const BASE = 150;

export default function SlotSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Locals live in stack slots" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={222} title="On the left, the compiler's locals array with each name and depth. On the right, the VM's stack at run time. Row k on the left is slot k on the right.">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>COMPILER: locals</T>
        <T x={8} y={30} size={12} mono>scopeDepth = {st.depth}</T>
        <T x={226} y={12} size={11} weight={700} fill={tok('muted')}>VM: stack</T>
        {[0, 1, 2].map((k) => {
          const y = BASE - k * (RH + 6);
          const l = st.locals[k];
          const v = st.stack[k];
          const hot = st.hot === k;
          return (
            <g key={k}>
              <T x={200} y={y + RH / 2} size={11} mono anchor="middle" fill={tok('muted')}>{k}</T>
              {l && (
                <Box x={8} y={y} w={170} h={RH} fill={hot ? tok('brand', 0.12) : tok('panel')} stroke={hot ? tok('brand') : tok('line')}>
                  <T x={18} y={y + RH / 2} size={12.5} mono weight={700}>{l[0]}</T>
                  <T x={170} y={y + RH / 2} size={11.5} mono anchor="end" fill={l[1] === -1 ? tok('danger') : tok('muted')}>
                    depth {l[1]}
                  </T>
                </Box>
              )}
              {v !== undefined && (
                <Box x={222} y={y} w={170} h={RH} fill={hot ? tok('brand', 0.12) : tok('panel')} stroke={hot ? tok('brand') : tok('line')}>
                  <T x={307} y={y + RH / 2} size={12.5} mono anchor="middle">{v}</T>
                </Box>
              )}
            </g>
          );
        })}
        <T x={8} y={196} size={11} weight={700} fill={tok('muted')}>EMITTED</T>
        <T x={74} y={196} size={11.5} mono>{st.emit}</T>
        <T x={8} y={214} size={12} mono>{st.out ? `output: ${st.out}` : ''}</T>
      </Svg>
    </StepFrame>
  );
}
