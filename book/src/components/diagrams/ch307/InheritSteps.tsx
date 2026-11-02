// Chapter 307: copy-down inheritance in drip-rs, for
//   class A { hi() {...} me() {...} }
//   class B < A { hi() { print "B.hi"; super.hi(); } }
// The instructions are the real `drip-rs --disassemble` listing of that
// program (0019 GET_GLOBAL 'A', 0021 GET_GLOBAL 'B', 0023 INHERIT, 0024
// GET_GLOBAL 'B', 0026 CLOSURE <fn hi> capturing local 1, 0030 METHOD
// 'hi', 0032 POP, 0033 CLOSE_UPVALUE). The table steps follow the Inherit
// and Method arms of Vm::run in src/vm.rs: clone the superclass's table,
// add_all into the subclass, pop; then Method overwrites `hi`.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

type Entry = { k: string; v: string; fresh?: boolean };
type S = {
  op: string;
  stack: string[];
  a: Entry[];
  b: Entry[];
  copy?: Entry[];
  note: string;
};

const A: Entry[] = [{ k: 'hi', v: 'A.hi' }, { k: 'me', v: 'A.me' }];

const STATES: S[] = [
  {
    op: "0015 CLASS 'B', DEFINE_GLOBAL",
    stack: ['<script>'],
    a: A,
    b: [],
    note: 'A is finished: its methods table has hi and me. CLASS made B with an empty table, and DEFINE_GLOBAL stored it. The superclass clause comes next.',
  },
  {
    op: "0019 GET_GLOBAL 'A'",
    stack: ['<script>', 'A (super)'],
    a: A,
    b: [],
    note: 'The compiler opened a scope and declared a local named super, so this A in slot 1 stays there for the whole class body. Methods that use super will capture it.',
  },
  {
    op: "0021 GET_GLOBAL 'B'",
    stack: ['<script>', 'A (super)', 'B'],
    a: A,
    b: [],
    note: 'Now the superclass is at peek(1) and the subclass at peek(0). Inherit checks that peek(1) is a Value::Class, or reports “Superclass must be a class.”.',
  },
  {
    op: '0023 INHERIT: clone',
    stack: ['<script>', 'A (super)', 'B'],
    a: A,
    b: [],
    copy: A.map((e) => ({ ...e, fresh: true })),
    note: 'self.heap[superclass].methods.clone() copies A’s Table into a local. It is plain Rust memory, two Vecs, not a Drip object, so no collection can start here. The borrow of the heap ends with this statement.',
  },
  {
    op: '0023 INHERIT: add_all',
    stack: ['<script>', 'A (super)'],
    a: A,
    b: A.map((e) => ({ ...e, fresh: true })),
    note: 'Now the heap can be borrowed mutably: self.heap[subclass].methods.add_all(&methods). B holds its own copy of both entries. Then the subclass is popped.',
  },
  {
    op: "0024 GET_GLOBAL 'B' ... 0030 METHOD 'hi'",
    stack: ['<script>', 'A (super)'],
    a: A,
    b: [{ k: 'hi', v: 'B.hi', fresh: true }, { k: 'me', v: 'A.me' }],
    note: 'B’s own hi is compiled after INHERIT, so its METHOD overwrites the copied entry. me stays A’s. Every later lookup on B is one probe in B’s table, with no chain to walk.',
  },
  {
    op: '0032 POP, 0033 CLOSE_UPVALUE',
    stack: ['<script>'],
    a: A,
    b: [{ k: 'hi', v: 'B.hi' }, { k: 'me', v: 'A.me' }],
    note: 'The scope around the class ends. B.hi captured super, so the slot is closed into an upvalue rather than just popped. super.hi() will read it with GET_UPVALUE 0 and run SUPER_INVOKE on A.',
  },
];

function Table({ x, title, rows, dash }: { x: number; title: string; rows: Entry[]; dash?: boolean }) {
  return (
    <g>
      <T x={x} y={126} size={10} mono weight={700} fill={tok('muted')}>{title}</T>
      <Box x={x} y={136} w={120} h={66} r={4} fill={tok('panel')} stroke={dash ? tok('accent') : tok('line')} dash={dash}>
        {rows.length === 0 && <T x={x + 60} y={169} size={10} anchor="middle" fill={tok('muted')}>empty</T>}
        {rows.map((e, i) => (
          <T key={i} x={x + 8} y={154 + i * 22} size={11} mono weight={e.fresh ? 700 : undefined} fill={e.fresh ? tok('safe') : tok('ink')}>
            {e.k} → {e.v}
          </T>
        ))}
      </Box>
    </g>
  );
}

export default function InheritSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="OP_INHERIT copies the methods down" steps={s} note={st.note}>
      <Svg w={400} h={226} title="The stack and the methods tables of classes A and B while class B < A is declared">
        <T x={8} y={12} size={12} mono weight={700}>{st.op}</T>
        <T x={8} y={34} size={10} mono weight={700} fill={tok('muted')}>stack</T>
        {st.stack.map((v, i) => (
          <Box key={i} x={8 + i * 130} y={44} w={124} h={26} r={3} fill={i === st.stack.length - 1 && i > 0 ? tok('brand', 0.14) : tok('panel')} stroke={tok('line')}>
            <T x={14 + i * 130} y={57} size={10} mono fill={tok('muted')}>{i}</T>
            <T x={26 + i * 130} y={57} size={10} mono weight={700} fill={tok('ink')}>{v}</T>
          </Box>
        ))}
        <Table x={8} title="A.methods" rows={st.a} />
        {st.copy && <Table x={140} title="local: methods" rows={st.copy} dash />}
        {st.copy && <Arrow x1={128} y1={169} x2={140} y2={169} color={tok('accent')} />}
        <Table x={272} title="B.methods" rows={st.b} />
        {!st.copy && st.b.some((e) => e.fresh && e.v.startsWith('A')) && (
          <Arrow x1={128} y1={169} x2={272} y2={169} color={tok('safe')} bend={0.25} />
        )}
        <T x={8} y={218} size={9} fill={tok('muted')}>Green: entries written by this step.</T>
      </Svg>
    </StepFrame>
  );
}
