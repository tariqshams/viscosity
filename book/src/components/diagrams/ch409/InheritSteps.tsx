// Chapter 409: copy-down inheritance in drip-rs, for
//   class A { hi() {...} me() {...} }
//   class B extends A {
//     hi() { print "B.hi"; super.hi(); }
//   }
// The instructions are the real `drip-rs --disassemble` listing of that
// program (rustc 1.97, 2026-11-02): 0022 class 'B', 0025 define.global,
// 0028 load.global 'A', 0031 load.global 'B', 0034 inherit, 0035
// load.global 'B', 0038 closure fn hi capturing local 1, 0043 method 'hi',
// 0046 pop, 0047 close.upvalue. The TypeScript VM's listing is identical.
// The table steps follow the Inherit and Method arms of Vm::run in
// book/companion/rust/src/vm.rs: clone the superclass's table, add_all
// into the subclass, pop; then Method overwrites `hi`.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

type Entry = { k: string; v: string; fresh?: boolean };
type S = {
  op: string;
  stack: string[];
  b: Entry[];
  copy?: Entry[];
  note: string;
};

const A: Entry[] = [{ k: 'hi', v: 'A.hi' }, { k: 'me', v: 'A.me' }];

const STATES: S[] = [
  {
    op: "0022 class 'B'",
    stack: ['fn script'],
    b: [],
    note: 'A is finished, with hi and me in its methods table. class makes B with an empty table, and define.global stores it as the global B.',
  },
  {
    op: "0028 load.global 'A'",
    stack: ['fn script', 'A (super)'],
    b: [],
    note: 'The compiler opened a scope and made a local named super, so this A in slot 1 stays put for the whole class body. Methods that say super will capture it.',
  },
  {
    op: "0031 load.global 'B'",
    stack: ['fn script', 'A (super)', 'B'],
    b: [],
    note: 'Now the superclass is at peek(1) and the subclass at peek(0). inherit checks that peek(1) is a Value::Class; if not, it is the runtime error “a class can only extend a class, not …”.',
  },
  {
    op: '0034 inherit: clone',
    stack: ['fn script', 'A (super)', 'B'],
    b: [],
    copy: A.map((e) => ({ ...e, fresh: true })),
    note: 'self.heap[superclass].methods.clone() copies A’s Table into a Rust local. That is plain Rust memory, not a Drip object, so no collection can start. The shared borrow of the heap ends at the semicolon.',
  },
  {
    op: '0034 inherit: add_all',
    stack: ['fn script', 'A (super)'],
    b: A.map((e) => ({ ...e, fresh: true })),
    note: 'Now the heap can be borrowed mutably: self.heap[subclass].methods.add_all(&methods). B holds its own copy of both entries, and the subclass is popped.',
  },
  {
    op: "0038 closure … 0043 method 'hi'",
    stack: ['fn script', 'A (super)'],
    b: [{ k: 'hi', v: 'B.hi', fresh: true }, { k: 'me', v: 'A.me' }],
    note: 'B’s own hi is compiled after inherit, so its method instruction overwrites the copied entry; me stays A’s. Every later lookup on B is one probe in B’s own table.',
  },
  {
    op: '0046 pop, 0047 close.upvalue',
    stack: ['fn script'],
    b: [{ k: 'hi', v: 'B.hi' }, { k: 'me', v: 'A.me' }],
    note: 'The scope around the class ends. B.hi captured super, so the slot is closed into an upvalue rather than dropped; super.hi() reads it with load.upvalue 0 and runs invoke.super on A.',
  },
];

function Table({ x, title, rows, dash }: { x: number; title: string; rows: Entry[]; dash?: boolean }) {
  return (
    <g>
      <T x={x} y={128} size={11} mono weight={700} fill={tok('muted')}>{title}</T>
      <Box x={x} y={140} w={124} h={66} r={4} fill={tok('panel')} stroke={dash ? tok('accent') : tok('line')} dash={dash}>
        {rows.length === 0 && <T x={x + 62} y={173} size={11} anchor="middle" fill={tok('muted')}>empty</T>}
        {rows.map((e, i) => (
          <T key={i} x={x + 8} y={159 + i * 24} size={12} mono weight={e.fresh ? 700 : undefined} fill={e.fresh ? tok('safe') : tok('ink')}>
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
    <StepFrame title="inherit copies the methods down" steps={s} note={st.note}>
      <Svg w={400} h={236} title="The stack and the methods tables of classes A and B while class B extends A is declared">
        <Box x={4} y={2} w={392} h={26} r={4} fill={tok('panel')} stroke={tok('line')}>
          <T x={12} y={15} size={12} mono weight={700}>{st.op}</T>
        </Box>
        <T x={4} y={44} size={11} mono weight={700} fill={tok('muted')}>stack</T>
        {st.stack.map((v, i) => (
          <Box key={i} x={4 + i * 132} y={56} w={126} h={28} r={3} fill={i === st.stack.length - 1 && i > 0 ? tok('brand', 0.14) : tok('panel')} stroke={tok('line')}>
            <T x={12 + i * 132} y={70} size={11} mono fill={tok('muted')}>{i}</T>
            <T x={26 + i * 132} y={70} size={12} mono weight={700} fill={tok('ink')}>{v}</T>
          </Box>
        ))}
        <Table x={4} title="A.methods" rows={A} />
        {st.copy && <Table x={138} title="local: methods" rows={st.copy} dash />}
        {st.copy && <Arrow x1={128} y1={173} x2={138} y2={173} color={tok('accent')} />}
        <Table x={272} title="B.methods" rows={st.b} />
        {!st.copy && st.b.some((e) => e.fresh && e.v.startsWith('A')) && (
          <Arrow x1={128} y1={173} x2={272} y2={173} color={tok('safe')} bend={0.25} />
        )}
        <T x={4} y={226} size={11} fill={tok('muted')}>Green: entries written by this step.</T>
      </Svg>
    </StepFrame>
  );
}
