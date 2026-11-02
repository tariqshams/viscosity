// Chapter 273: one upvalue's life in drip-rs, for
//   fn makeCounter() {
//     let n = 0;
//     fn count() { n = n + 1; return n; }
//     return count;
//   }
//   let c = makeCounter();
//   print c(); print c();
// The operands are the real `drip-rs --disassemble` listing (makeCounter's
// frame starts at slot 1, n is local 1, so the captured slot is 2; count
// reads it with GET_UPVALUE 0). It prints 1 then 2. The upvalue is the
// first one allocated, so its handle is Gc(0), and count's closure is the
// third closure (script, makeCounter, count), Gc(2). The steps follow
// capture_upvalue, close_upvalues and the GetUpvalue/SetUpvalue arms of
// src/vm.rs.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

type S = {
  op: string;
  stack: string[];
  open: string[];
  up: string | null;
  closure: boolean;
  pointsAt: number | null;
  hot: ('stack' | 'open' | 'up' | 'closure')[];
  note: string;
};

const STATES: S[] = [
  {
    op: 'makeCounter: let n = 0;',
    stack: ['<script>', '<fn makeCounter>', '0'], open: [], up: null, closure: false, pointsAt: null, hot: ['stack'],
    note: 'makeCounter’s frame starts at slot 1 (its own closure), so its local n lives in slot 2. Nothing has been captured yet: the open list is empty and so is the upvalue arena.',
  },
  {
    op: 'OP_CLOSURE <fn count>, local 1',
    stack: ['<script>', '<fn makeCounter>', '0'], open: ['Gc(0)'], up: 'Open(2)', closure: false, pointsAt: 2, hot: ['open', 'up'],
    note: 'The operand says “local 1”, so capture_upvalue(slots + 1), slot 2. The open list has no upvalue for slot 2, so one is allocated, ObjUpvalue::Open(2), and its handle is inserted in slot order.',
  },
  {
    op: 'alloc(ObjClosure { .. })',
    stack: ['<script>', '<fn makeCounter>', '0', '<fn count>'], open: ['Gc(0)'], up: 'Open(2)', closure: true, pointsAt: 2, hot: ['closure', 'stack'],
    note: 'Only now, with every upvalue captured into a local Vec, is the closure allocated, holding upvalues: [Gc(0)]. If a collection ran here, the upvalue would survive: it is in the open list, a root.',
  },
  {
    op: 'OP_RETURN: close_upvalues(1)',
    stack: ['<script>', '<fn count>'], open: [], up: 'Closed(0)', closure: true, pointsAt: null, hot: ['up', 'open'],
    note: 'Returning closes every open upvalue at or above the frame’s base, slot 1. Gc(0) points at slot 2, so heap[Gc(0)] = Closed(stack[2]) copies 0 into it, and it leaves the open list. Then the frame’s slots go.',
  },
  {
    op: 'c(): OP_GET_UPVALUE 0',
    stack: ['<script>', '<fn count>', '0'], open: [], up: 'Closed(0)', closure: true, pointsAt: null, hot: ['closure', 'up'],
    note: 'count runs in a new frame. Upvalue 0 of the running closure is Gc(0): two heap lookups, one for the closure, one for the upvalue. It is Closed, so the value comes from the upvalue itself.',
  },
  {
    op: 'c(): OP_SET_UPVALUE 0',
    stack: ['<script>', '<fn count>', '1'], open: [], up: 'Closed(1)', closure: true, pointsAt: null, hot: ['up'],
    note: 'n + 1 is written back through &mut self.heap[Gc(0)], into the Closed variant. The handle never changed, so any other closure holding Gc(0) would see 1 too. The first print shows 1, the second 2.',
  },
];

const slotY = (i: number) => 236 - i * 34;

export default function UpvalueSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const hot = (k: S['hot'][number]) => st.hot.includes(k);
  return (
    <StepFrame title="Capturing and closing an upvalue" steps={s} note={st.note}>
      <Svg w={400} h={300} title="The stack, the open-upvalue list, the upvalue arena and count's closure">
        <Box x={8} y={6} w={384} h={28} r={4} fill={tok('panel')} stroke={tok('line')}>
          <T x={16} y={20} size={12} mono weight={700}>{st.op}</T>
        </Box>

        <T x={8} y={52} size={10} mono weight={700} fill={tok('muted')}>stack</T>
        {[0, 1, 2, 3, 4].map((i) => {
          const v = st.stack[i];
          const target = st.pointsAt === i;
          return (
            <g key={i}>
              <Box x={24} y={slotY(i)} w={124} h={28} r={3}
                fill={v === undefined ? tok('paper') : target ? tok('accent', 0.16) : tok('panel')}
                stroke={target ? tok('accent') : tok('line')} dash={v === undefined}>
                {v !== undefined && <T x={86} y={slotY(i) + 14} size={10} mono anchor="middle" fill={tok('ink')}>{v}</T>}
              </Box>
              <T x={16} y={slotY(i) + 14} size={9} mono anchor="end" fill={tok('muted')}>{i}</T>
            </g>
          );
        })}

        <T x={176} y={52} size={10} mono weight={700} fill={tok('muted')}>open_upvalues: Vec</T>
        <Box x={176} y={62} w={216} h={30} r={4} fill={hot('open') ? tok('brand', 0.12) : tok('panel')} stroke={hot('open') ? tok('brand') : tok('line')}>
          <T x={186} y={77} size={11} mono fill={tok('ink')}>[{st.open.join(', ')}]</T>
        </Box>

        <T x={176} y={112} size={10} mono weight={700} fill={tok('muted')}>heap.upvalues</T>
        <Box x={176} y={122} w={216} h={34} r={4} fill={hot('up') ? tok('brand', 0.12) : tok('panel')} stroke={hot('up') ? tok('brand') : tok('line')}>
          <T x={186} y={139} size={9} mono fill={tok('muted')}>0</T>
          <T x={204} y={139} size={11} mono weight={700} fill={st.up ? tok('ink') : tok('muted')}>{st.up ?? '(empty)'}</T>
        </Box>

        <T x={176} y={178} size={10} mono weight={700} fill={tok('muted')}>heap.closures[2]: count</T>
        <Box x={176} y={188} w={216} h={34} r={4} dash={!st.closure}
          fill={hot('closure') ? tok('brand', 0.12) : st.closure ? tok('panel') : tok('paper')} stroke={hot('closure') ? tok('brand') : tok('line')}>
          <T x={186} y={205} size={11} mono fill={st.closure ? tok('ink') : tok('muted')}>{st.closure ? 'upvalues: [Gc(0)]' : 'not allocated yet'}</T>
        </Box>

        {st.open.length > 0 && <Arrow x1={240} y1={92} x2={240} y2={122} color={tok('muted')} />}
        {st.closure && <Arrow x1={330} y1={188} x2={330} y2={156} color={tok('brand')} />}
        {st.pointsAt !== null && (
          <Arrow x1={176} y1={146} x2={150} y2={slotY(st.pointsAt) + 14} color={tok('accent')} bend={0.2} />
        )}
        <T x={8} y={278} size={9} fill={tok('muted')}>Arrow into the stack: an Open upvalue names a slot.</T>
        <T x={8} y={292} size={9} fill={tok('muted')}>Arrow up from the closure: it holds the handle, not the value.</T>
      </Svg>
    </StepFrame>
  );
}
