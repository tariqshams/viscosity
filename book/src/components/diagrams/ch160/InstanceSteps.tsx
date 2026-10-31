// Chapter 160: an instance and its field table in drip-rs, for
//   class Point {}
//   let p = Point();
//   p.x = 3;
//   print p.x;
//   print p;
// The instructions are the real `drip-rs --disassemble` listing, and the
// program prints `3` and `Point instance`. Point is the first class and p
// the first instance, so both handles are Gc(0). The stack effects follow
// the Class, GetProperty and SetProperty arms and the Value::Class branch
// of call_value in src/vm.rs.
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
    op: '0000 OP_CLASS 0 \'Point\'',
    stack: ['<script>', 'Class(Gc(0))'], cls: true, inst: null, hot: ['cls', 'stack'],
    note: 'Class allocates an ObjClass with its interned name and an empty methods Table, and pushes Value::Class with the handle. DEFINE_GLOBAL then moves it into the globals table as Point.',
  },
  {
    op: '0009 OP_CALL 0',
    stack: ['<script>', 'Instance(Gc(0))'], cls: true, inst: '(empty)', hot: ['inst', 'stack'],
    note: 'Calling a class makes an instance. call_value allocates the ObjInstance while the class is still on the stack (so a collection can’t free it), then set_peek overwrites the callee’s slot with the instance. No init, and 0 arguments: done.',
  },
  {
    op: '0015 OP_CONSTANT \'3\'',
    stack: ['<script>', 'Instance(Gc(0))', '3'], cls: true, inst: '(empty)', hot: ['stack'],
    note: 'For p.x = 3, the compiler emitted GET_GLOBAL p and the value first, then SET_PROPERTY. So the instance is one below the top, the value on top.',
  },
  {
    op: '0017 OP_SET_PROPERTY \'x\'',
    stack: ['<script>', '3'], cls: true, inst: 'x → 3', hot: ['inst', 'stack'],
    note: 'peek(1) must be an instance, or “Only instances have fields.”. The name and value are read into locals, then heap[inst].fields.set(x, 3). Two pops and a push leave 3, the assignment’s value. The next POP drops it.',
  },
  {
    op: '0022 OP_GET_PROPERTY \'x\'',
    stack: ['<script>', '3'], cls: true, inst: 'x → 3', hot: ['inst', 'stack'],
    note: 'GET_GLOBAL p pushed the instance. fields.get(x) returns Some(Value::Number(3)), a copy, so the borrow of the heap ends there. The instance is popped and 3 pushed. PRINT shows 3.',
    out: '3',
  },
  {
    op: '0027 OP_PRINT',
    stack: ['<script>'], cls: true, inst: 'x → 3', hot: ['cls', 'inst'],
    note: 'Printing an instance is two lookups: heap[i].class for the class handle, then heap[class].name for its name, giving “Point instance”.',
    out: '3\nPoint instance',
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
        <T x={8} y={52} size={10} mono weight={700} fill={tok('muted')}>stack</T>
        {[0, 1, 2, 3].map((i) => {
          const v = st.stack[i];
          return (
            <g key={i}>
              <Box x={24} y={slotY(i)} w={130} h={28} r={3} dash={v === undefined}
                fill={v === undefined ? tok('paper') : hot('stack') && i === st.stack.length - 1 ? tok('brand', 0.14) : tok('panel')}
                stroke={tok('line')}>
                {v !== undefined && <T x={89} y={slotY(i) + 14} size={10} mono anchor="middle" fill={tok('ink')}>{v}</T>}
              </Box>
              <T x={16} y={slotY(i) + 14} size={9} mono anchor="end" fill={tok('muted')}>{i}</T>
            </g>
          );
        })}

        <T x={176} y={52} size={10} mono weight={700} fill={tok('muted')}>heap.classes[0]</T>
        <Box x={176} y={60} w={216} h={44} r={4} dash={!st.cls}
          fill={hot('cls') ? tok('brand', 0.12) : tok('panel')} stroke={hot('cls') ? tok('brand') : tok('line')}>
          <T x={186} y={75} size={10} mono fill={tok('ink')}>name: "Point"</T>
          <T x={186} y={92} size={10} mono fill={tok('muted')}>methods: Table (empty)</T>
        </Box>

        <T x={176} y={124} size={10} mono weight={700} fill={tok('muted')}>heap.instances[0]</T>
        <Box x={176} y={132} w={216} h={70} r={4} dash={st.inst === null}
          fill={st.inst === null ? tok('paper') : hot('inst') ? tok('brand', 0.12) : tok('panel')} stroke={hot('inst') ? tok('brand') : tok('line')}>
          {st.inst === null ? (
            <T x={284} y={167} size={10} mono anchor="middle" fill={tok('muted')}>not allocated yet</T>
          ) : (
            <>
              <T x={186} y={148} size={10} mono fill={tok('ink')}>class: Gc(0)</T>
              <T x={186} y={166} size={10} mono fill={tok('muted')}>fields: Table</T>
              <Box x={276} y={176} w={108} h={20} r={3} fill={tok('paper')} stroke={tok('line')}>
                <T x={284} y={186} size={10} mono weight={700} fill={tok('ink')}>{st.inst}</T>
              </Box>
            </>
          )}
        </Box>
        {st.inst !== null && <Arrow x1={200} y1={132} x2={200} y2={104} color={tok('accent')} />}

        <T x={8} y={244} size={10} mono weight={700} fill={tok('muted')}>stdout</T>
        <T x={60} y={244} size={10} mono fill={tok('ink')}>{(st.out ?? '').split('\n').join('   ')}</T>
        <T x={8} y={262} size={9} fill={tok('muted')}>Values on the stack hold handles; the objects live in the arenas.</T>
      </Svg>
    </StepFrame>
  );
}
