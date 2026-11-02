// Chapter 83: a for loop gives every pass a fresh loop variable in the
// same stack slot, and closes its upvalue at the end of each pass, so each
// closure keeps its own value. Follows forStatement and endScope in
// companion/ts/src/vm/compiler.ts, and closeUpvalues in vm.ts.
import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const CODE = `let fs = [];
for i in 0..2 {
  push(fs, fn () { return i; });
}
print fs[0]();
print fs[1]();`;

type Up = { name: string; slot: number; closed: string };
type S = {
  line: number;
  op: string;
  slots: (string | null)[];
  ups: Up[];
  hot?: number;
  out?: string;
  note: string;
};

const STATES: S[] = [
  { line: 1, op: 'iter.range', slots: ['<script>', 'counter 0', 'end 2', null], ups: [], note: 'The loop keeps two hidden locals: the counter (slot 1) and the end (slot 2). The loop variable i will get slot 3.' },
  { line: 1, op: 'load.local 1', slots: ['<script>', 'counter 0', 'end 2', 'i = 0'], ups: [], hot: 3, note: 'Pass 1 starts by copying the counter into slot 3. That copy is i: a fresh local, in a scope of its own inside the loop.' },
  { line: 2, op: 'closure (local 3)', slots: ['<script>', 'counter 0', 'end 2', 'i = 0'], ups: [{ name: 'A', slot: 3, closed: '–' }], hot: 3, note: 'The anonymous function captures slot 3. No open upvalue exists for it, so upvalue A is made, open, pointing at slot 3.' },
  { line: 3, op: 'close.upvalue', slots: ['<script>', 'counter 0', 'end 2', null], ups: [{ name: 'A', slot: -1, closed: '0' }], note: 'The body’s } ends i’s scope. i was captured, so the compiler emitted close.upvalue, not pop: A copies 0 into itself, leaves the open list, and slot 3 is popped.' },
  { line: 1, op: 'inc.local 1', slots: ['<script>', 'counter 1', 'end 2', null], ups: [{ name: 'A', slot: -1, closed: '0' }], hot: 1, note: 'inc.local adds 1 to the hidden counter (not to i), and loop jumps back to the test: 1 < 2.' },
  { line: 2, op: 'closure (local 3)', slots: ['<script>', 'counter 1', 'end 2', 'i = 1'], ups: [{ name: 'A', slot: -1, closed: '0' }, { name: 'B', slot: 3, closed: '–' }], hot: 3, note: 'Pass 2: i = 1 lands in the same slot 3. But the open list is empty (A was closed and unlinked), so captureUpvalue makes a new upvalue, B.' },
  { line: 3, op: 'close.upvalue', slots: ['<script>', 'counter 1', 'end 2', null], ups: [{ name: 'A', slot: -1, closed: '0' }, { name: 'B', slot: -1, closed: '1' }], note: 'The end of pass 2 closes B, with 1 in it. Two passes, two closed upvalues, two values.' },
  { line: 5, op: 'print', slots: ['<script>', null, null, null], ups: [{ name: 'A', slot: -1, closed: '0' }, { name: 'B', slot: -1, closed: '1' }], out: '0, 1', note: 'After the loop the hidden locals are popped. Each closure reads its own closed upvalue, so the program prints 0, then 1.' },
];

const SX = 8;
const SW = 120;
const SH = 26;
const SY = 34;

export default function ClosePassSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const slotY = (i: number) => SY + i * SH;
  return (
    <StepFrame title="A fresh i, closed at the end of every pass" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={176} title="The value stack on the left; the upvalue objects on the heap on the right">
        <T x={SX} y={14} size={11} weight={700} fill={tok('muted')}>VALUE STACK</T>
        <T x={214} y={14} size={11} weight={700} fill={tok('muted')}>UPVALUES</T>
        <T x={392} y={14} size={12} mono anchor="end" fill={tok('brand')}>{st.op}</T>
        {[0, 1, 2, 3].map((i) => {
          const v = st.slots[i];
          const live = v !== null && v !== undefined;
          return (
            <g key={i}>
              <Box x={SX + 22} y={slotY(i)} w={SW} h={SH - 4} r={3}
                fill={i === st.hot ? tok('brand', 0.14) : live ? tok('panel') : tok('line', 0.15)}
                stroke={i === st.hot ? tok('brand') : tok('line')} dash={!live}>
                <T x={SX + 30} y={slotY(i) + 11} size={12} mono opacity={live ? 1 : 0.5}>{live ? v : 'free'}</T>
              </Box>
              <T x={SX + 14} y={slotY(i) + 11} size={11} mono anchor="end" fill={tok('muted')}>{i}</T>
            </g>
          );
        })}
        {st.ups.map((u, k) => {
          const open = u.slot !== -1;
          const y = 34 + k * 56;
          const c = open ? tok('accent') : tok('safe');
          return (
            <g key={u.name}>
              <Box x={214} y={y} w={150} h={46} fill={open ? tok('accent', 0.1) : tok('safe', 0.12)} stroke={c}>
                <T x={224} y={y + 13} size={11} weight={700} fill={c}>upvalue {u.name} {open ? '(open)' : '(closed)'}</T>
                <T x={224} y={y + 31} size={12} mono>slot {u.slot}, closed {u.closed}</T>
              </Box>
              {open && <Arrow x1={214} y1={y + 23} x2={SX + SW + 24} y2={slotY(u.slot) + 11} color={tok('accent')} />}
            </g>
          );
        })}
        {st.out && <T x={214} y={162} size={12} mono fill={tok('muted')}>printed: {st.out}</T>}
      </Svg>
    </StepFrame>
  );
}
