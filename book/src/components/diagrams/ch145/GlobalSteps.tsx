import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// The companion's disassembler output for
//   let a = 1; print a; a = a + 2; b = 5;
// (one statement per line), and the real contents of vm.globals at each
// step, checked by running the program on the companion VM.
const CODE = `0000    1 const               0 '1'
0003    | define.global       1 'a'
0006    2 load.global         2 'a'
0009    | print
0010    3 load.global         4 'a'
0013    | const               5 '2'
0016    | add
0017    | store.global        3 'a'
0020    | pop
0021    4 const               7 '5'
0024    | store.global        6 'b'`;

/** A slot: a key and its value, a tombstone, or empty (null). */
type Slot = { k: string; v: string; hot?: boolean } | { tomb: true; hot?: boolean } | null;
type S = { line: number; stack: string[]; slots: Slot[]; probe?: number[]; out?: string; err?: string; note: string };

const N = (k: string): Slot => ({ k, v: 'fn' });
const A = (v: string, hot?: boolean): Slot => ({ k: 'a', v, hot });
const small = (a?: Slot): Slot[] => [N('pop'), N('str'), null, null, N('len'), N('clock'), N('push'), a ?? null];
const big = (a: Slot, b: Slot = null): Slot[] => [
  N('pop'), N('str'), null, null, null, b, null, null,
  null, null, null, null, N('len'), N('clock'), N('push'), a,
];

const STATES: S[] = [
  { line: -1, stack: ['script'], slots: small(), note: 'Before the first instruction. The globals table has 8 slots and five entries: the native functions, which the VM defines itself. (push sits in 6 and str in 1 because their own slots were taken.)' },
  { line: 0, stack: ['script', '1'], slots: small(), note: 'const pushes constant 0, the number 1. Nothing about a yet: its name is only the operand of the next instruction.' },
  { line: 1, stack: ['script'], slots: small(A('1', true)), probe: [4, 5, 6, 7], note: 'define.global reads constant 1, the interned string "a". Its hash picks slot 4 (len), so it probes 5 (clock), 6 (push) and stores in 7. Only then is the 1 popped. Six entries in 8 slots: a load of 0.75.' },
  { line: 2, stack: ['script', '1'], slots: small(A('1', true)), probe: [4, 5, 6, 7], note: 'load.global walks the same path, 4 to 7, compares keys by identity, and pushes the value it finds. The table is unchanged.' },
  { line: 3, stack: ['script'], slots: small(A('1')), out: '1', note: 'print pops the 1 and writes it out.' },
  { line: 6, stack: ['script', '3'], slots: small(A('1')), out: '1', note: 'a + 2 is load.global, const and add. The sum, 3, is on top of the stack.' },
  { line: 7, stack: ['script', '3'], slots: big(A('3', true)), out: '1', note: 'store.global: set() checks the load first. 6 + 1 is past 8 × 0.75, so the table grows to 16 slots and re-inserts every key, although a is already there. a now starts at slot 12 and lands in 15. set() returns false: the key was not new, all is well.' },
  { line: 8, stack: ['script'], slots: big(A('3')), out: '1', note: 'The 3 stayed on the stack, because an assignment is an expression. The statement is over, so pop drops it.' },
  { line: 9, stack: ['script', '5'], slots: big(A('3')), out: '1', note: 'Now b = 5, but no let b ever ran. const pushes 5.' },
  { line: 10, stack: ['script', '5'], slots: big(A('3'), { k: 'b', v: '5', hot: true }), out: '1', note: '"b" hashes to slot 5, which is empty. set() stores it and returns true: the key was NEW. That is the sign that b was never defined.' },
  { line: 10, stack: ['script', '5'], slots: big(A('3'), { tomb: true, hot: true }), out: '1', err: "undefined variable 'b'", note: 'So the VM deletes the key again, leaving a tombstone, and reports the runtime error. One table operation for every correct assignment; only the mistake pays for the undo.' },
];

const CW = 48;

export default function GlobalSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const rows = st.slots.length / 8;
  return (
    <StepFrame title="Globals in a hash table" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={232} title="The globals table, one or two rows of eight slots, with the value stack below it. Global instructions find a name's slot by its hash.">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>GLOBALS TABLE ({st.slots.length} slots)</T>
        {st.slots.map((sl, k) => {
          const x = 8 + (k % 8) * CW;
          const y = 34 + Math.floor(k / 8) * 62;
          const hot = sl && sl.hot;
          const onPath = st.probe?.includes(k);
          return (
            <g key={k}>
              <T x={x + (CW - 4) / 2} y={y - 8} size={11} mono anchor="middle" fill={onPath ? tok('accent') : tok('muted')}>{k}</T>
              <Box x={x} y={y} w={CW - 4} h={42} r={3} fill={hot ? tok('brand', 0.15) : tok('panel')} stroke={hot ? tok('brand') : onPath ? tok('accent') : tok('line')}>
                {sl && 'k' in sl ? (
                  <>
                    <T x={x + (CW - 4) / 2} y={y + 13} size={11} mono anchor="middle" weight={700}>{sl.k}</T>
                    <T x={x + (CW - 4) / 2} y={y + 30} size={11} mono anchor="middle" fill={tok('muted')}>{sl.v}</T>
                  </>
                ) : sl ? (
                  <T x={x + (CW - 4) / 2} y={y + 21} size={11} anchor="middle" fill={tok('danger')}>tomb</T>
                ) : null}
              </Box>
            </g>
          );
        })}
        <T x={8} y={rows === 2 ? 168 : 106} size={11} weight={700} fill={tok('muted')}>STACK (bottom → top)</T>
        {st.stack.map((v, k) => (
          <Box key={k} x={8 + k * 70} y={rows === 2 ? 178 : 116} w={64} h={26} fill={k === st.stack.length - 1 && k > 0 ? tok('brand', 0.12) : tok('panel')}>
            <T x={40 + k * 70} y={(rows === 2 ? 178 : 116) + 13} size={12} mono anchor="middle">{v}</T>
          </Box>
        ))}
        <T x={8} y={rows === 2 ? 222 : 160} size={12} mono fill={st.err ? tok('danger') : tok('ink')}>
          {st.err ? `runtime error: ${st.err}` : st.out ? `output: ${st.out}` : ''}
        </T>
      </Svg>
    </StepFrame>
  );
}
