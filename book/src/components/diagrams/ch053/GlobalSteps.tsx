import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// Real output of the disassembler for:
//   let a = 1; print a; a = a + 2; b = 5;
// (one statement per line), shortened to fit a phone.
const CODE = `0000 CONSTANT       '1'
0002 DEFINE_GLOBAL  'a'
0004 GET_GLOBAL     'a'
0006 PRINT
0007 GET_GLOBAL     'a'
0009 CONSTANT       '2'
0011 ADD
0012 SET_GLOBAL     'a'
0014 POP
0015 CONSTANT       '5'
0017 SET_GLOBAL     'b'`;

/** One slot of the globals table: a key and its value, or a tombstone. */
type Slot = { k: string; v: string; hot?: boolean } | { tomb: true; hot?: boolean } | null;
type S = { line: number; stack: string[]; slots: Slot[]; out?: string; err?: string; note: string };

const CLOCK: Slot = { k: 'clock', v: '<native>' };
const base = (a?: string, hot?: boolean): Slot[] => [null, null, null, null, a ? { k: 'a', v: a, hot } : null, CLOCK, null, null];

const STATES: S[] = [
  { line: -1, stack: ['<script>'], slots: base(), note: 'Before the first instruction. The table already has 8 slots and one entry: the native clock, defined by the VM itself. Slot 0 of the stack holds the running script.' },
  { line: 0, stack: ['<script>', '1'], slots: base(), note: 'CONSTANT pushes the initializer, 1. Nothing about a yet: the name is only an operand of the next instruction.' },
  { line: 1, stack: ['<script>'], slots: base('1', true), note: 'DEFINE_GLOBAL reads constant 0, the interned string "a". Its hash picks slot 4. The value is stored, and only then popped.' },
  { line: 2, stack: ['<script>', '1'], slots: base('1', true), note: 'GET_GLOBAL hashes "a" again, finds slot 4 and pushes a copy of the value. The table is unchanged.' },
  { line: 3, stack: ['<script>'], slots: base('1'), out: '1', note: 'PRINT pops the 1 and writes it out.' },
  { line: 6, stack: ['<script>', '3'], slots: base('1'), out: '1', note: 'a + 2: GET_GLOBAL, CONSTANT, ADD. The sum, 3, is on top of the stack.' },
  { line: 7, stack: ['<script>', '3'], slots: base('3', true), out: '1', note: 'SET_GLOBAL stores 3 under "a". The key already existed, so set() returns false: all is well. The 3 stays on the stack, because an assignment is an expression.' },
  { line: 8, stack: ['<script>'], slots: base('3'), out: '1', note: 'The statement is over, so its value is dropped: an expression statement ends in POP.' },
  { line: 9, stack: ['<script>', '5'], slots: base('3'), out: '1', note: 'Now b = 5, but no let b ever ran. CONSTANT pushes 5.' },
  { line: 10, stack: ['<script>', '5'], slots: [null, null, null, null, { k: 'a', v: '3' }, CLOCK, { k: 'b', v: '5', hot: true }, null], out: '1', note: '"b" hashes to slot 5, which clock holds, so it probes on to slot 6. set() stores it and returns true: the key was NEW. That is the signal that b was never defined.' },
  { line: 10, stack: ['<script>', '5'], slots: [null, null, null, null, { k: 'a', v: '3' }, CLOCK, { tomb: true, hot: true }, null], out: '1', err: "Undefined variable 'b'.", note: 'So the VM deletes the key again, leaving a tombstone, and reports the error. One lookup in the common case; the rare mistake pays for the undo.' },
];

const CW = 46;

export default function GlobalSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Globals in a hash table" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={188} title="The value stack on the left and the eight-slot globals table on the right. Global instructions read a name from the constant pool and look it up in the table.">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>STACK</T>
        {st.stack.map((v, k) => {
          const y = 150 - k * 30;
          return (
            <Box key={k} x={8} y={y} w={80} h={26} fill={k === st.stack.length - 1 && k > 0 ? tok('brand', 0.12) : tok('panel')}>
              <T x={48} y={y + 13} size={12} mono anchor="middle">{v}</T>
            </Box>
          );
        })}
        <T x={8} y={182} size={10.5} fill={tok('muted')}>slot 0 at the bottom</T>
        <T x={104} y={12} size={11} weight={700} fill={tok('muted')}>GLOBALS TABLE (8 slots)</T>
        {st.slots.map((sl, k) => {
          const x = 104 + (k % 4) * (CW + 26);
          const y = 30 + Math.floor(k / 4) * 70;
          const hot = sl && sl.hot;
          return (
            <g key={k}>
              <T x={x + CW / 2 + 10} y={y} size={10} mono anchor="middle" fill={tok('muted')}>{k}</T>
              <Box x={x} y={y + 8} w={CW + 20} h={46} fill={hot ? tok('brand', 0.15) : tok('panel')} stroke={hot ? tok('brand') : tok('line')}>
                {sl && 'k' in sl ? (
                  <>
                    <T x={x + CW / 2 + 10} y={y + 22} size={11.5} mono anchor="middle" weight={700}>{sl.k}</T>
                    <T x={x + CW / 2 + 10} y={y + 40} size={11} mono anchor="middle">{sl.v}</T>
                  </>
                ) : sl ? (
                  <T x={x + CW / 2 + 10} y={y + 31} size={10.5} anchor="middle" fill={tok('danger')}>tombstone</T>
                ) : null}
              </Box>
            </g>
          );
        })}
        <T x={104} y={168} size={12} mono fill={st.err ? tok('danger') : tok('ink')}>
          {st.err ? st.err : st.out ? `output: ${st.out}` : ''}
        </T>
      </Svg>
    </StepFrame>
  );
}
