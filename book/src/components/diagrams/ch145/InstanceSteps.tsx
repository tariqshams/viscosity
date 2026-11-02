// Chapter 145: an instance and its field table in drip-rs, for
//   class Point {}
//   let p = new Point();
//   p.x = 3;
//   print p.x;
//   print p;
// The instructions are the real `drip-rs --disassemble` listing (rustc
// 1.97, 2026-11-02), and the program prints `3` and `Point { x: 3 }`.
// Point is the first class and p the first instance, so both handles are
// Gc(0). The stack effects follow the Class, New, SetProp and GetProp
// arms and Vm::new_instance in book/companion/rust/src/vm.rs.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

type S = {
  op: string;
  stack: string[];
  cls: boolean;
  inst: string | null;
  hot: ('cls' | 'inst' | 'stack')[];
  out?: string;
  note: string;
};

const STATES: S[] = [
  {
    op: "0000 class 'Point'",
    stack: ['fn script', 'Class(Gc(0))'], cls: true, inst: null, hot: ['cls', 'stack'],
    note: 'class allocates an ObjClass with its interned name and an empty methods Table, and pushes Value::Class with the handle. define.global then moves it into the globals table as Point.',
  },
  {
    op: '0013 new 0',
    stack: ['fn script', 'Instance(Gc(0))'], cls: true, inst: '(empty)', hot: ['inst', 'stack'],
    note: 'load.global pushed the class; new_instance allocates the ObjInstance while the class is still on the stack (so a collection cannot free it), then set_peek overwrites the class’s slot with the instance. No init and no arguments: done.',
  },
  {
    op: "0021 const '3'",
    stack: ['fn script', 'Instance(Gc(0))', '3'], cls: true, inst: '(empty)', hot: ['stack'],
    note: 'For p.x = 3 the compiler emitted load.global p and the value first, then set.prop. So the instance is one below the top and the value is on top.',
  },
  {
    op: "0024 set.prop 'x'",
    stack: ['fn script', '3'], cls: true, inst: 'x → 3', hot: ['inst', 'stack'],
    note: 'peek(1) must be an instance, or “cannot set ‘x’ on …”. The name and value are read into locals first; then fields.set(x, 3) returns true (a new key), so x is pushed onto field_order. A pop and a set_peek leave 3, the assignment’s value; the next pop drops it.',
  },
  {
    op: "0031 get.prop 'x'",
    stack: ['fn script', '3'], cls: true, inst: 'x → 3', hot: ['inst', 'stack'],
    note: 'load.global p pushed the instance. fields.get(x) returns Some(Value::Number(3)), a copy, so the borrow of the heap ends there, and set_peek(0, value) puts 3 where the instance was. print shows 3.',
    out: '3',
  },
  {
    op: '0038 print',
    stack: ['fn script'], cls: true, inst: 'x → 3', hot: ['cls', 'inst'],
    note: 'Printing an instance looks up its class’s name, then walks field_order (the names in the order they were first set) and fetches each value from the table: Point { x: 3 }.',
    out: '3\nPoint { x: 3 }',
  },
];

const slotY = (i: number) => 214 - i * 34;

export default function InstanceSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const hot = (k: S['hot'][number]) => st.hot.includes(k);
  return (
    <StepFrame title="An instance and its fields" steps={s} note={st.note}>
      <Svg w={400} h={270} title="The value stack, the class arena, the instance arena and the instance's fields table">
        <Box x={8} y={6} w={384} h={28} r={4} fill={tok('panel')} stroke={tok('line')}>
          <T x={16} y={20} size={12} mono weight={700}>{st.op}</T>
        </Box>
        <T x={8} y={52} size={11} mono weight={700} fill={tok('muted')}>stack</T>
        {[0, 1, 2, 3].map((i) => {
          const v = st.stack[i];
          return (
            <g key={i}>
              <Box x={24} y={slotY(i)} w={130} h={28} r={3} dash={v === undefined}
                fill={v === undefined ? tok('paper') : hot('stack') && i === st.stack.length - 1 ? tok('brand', 0.14) : tok('panel')}
                stroke={tok('line')}>
                {v !== undefined && <T x={89} y={slotY(i) + 14} size={11} mono anchor="middle" fill={tok('ink')}>{v}</T>}
              </Box>
              <T x={16} y={slotY(i) + 14} size={11} mono anchor="end" fill={tok('muted')}>{i}</T>
            </g>
          );
        })}

        <T x={176} y={52} size={11} mono weight={700} fill={tok('muted')}>heap.classes[0]</T>
        <Box x={176} y={60} w={216} h={44} r={4} dash={!st.cls}
          fill={hot('cls') ? tok('brand', 0.12) : tok('panel')} stroke={hot('cls') ? tok('brand') : tok('line')}>
          <T x={186} y={75} size={11} mono fill={tok('ink')}>name: "Point"</T>
          <T x={186} y={92} size={11} mono fill={tok('muted')}>methods: Table (empty)</T>
        </Box>

        <T x={176} y={124} size={11} mono weight={700} fill={tok('muted')}>heap.instances[0]</T>
        <Box x={176} y={132} w={216} h={70} r={4} dash={st.inst === null}
          fill={st.inst === null ? tok('paper') : hot('inst') ? tok('brand', 0.12) : tok('panel')} stroke={hot('inst') ? tok('brand') : tok('line')}>
          {st.inst === null ? (
            <T x={284} y={167} size={11} mono anchor="middle" fill={tok('muted')}>not allocated yet</T>
          ) : (
            <>
              <T x={186} y={148} size={11} mono fill={tok('ink')}>class: Gc(0)</T>
              <T x={186} y={166} size={11} mono fill={tok('muted')}>fields, field_order</T>
              <Box x={186} y={176} w={198} h={20} r={3} fill={tok('paper')} stroke={tok('line')}>
                <T x={194} y={186} size={11} mono weight={700} fill={tok('ink')}>{st.inst}</T>
              </Box>
            </>
          )}
        </Box>
        {st.inst !== null && <Arrow x1={200} y1={132} x2={200} y2={104} color={tok('accent')} />}

        <T x={8} y={244} size={11} mono weight={700} fill={tok('muted')}>stdout</T>
        <T x={60} y={244} size={11} mono fill={tok('ink')}>{(st.out ?? '').split('\n').join('   ')}</T>
        <T x={8} y={262} size={11} fill={tok('muted')}>Values on the stack hold handles; the objects live in the arenas.</T>
      </Svg>
    </StepFrame>
  );
}
