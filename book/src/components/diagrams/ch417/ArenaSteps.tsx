// Chapter 417: VIR's arenas in engine/rust/crates/vir. The function is the
// real VIR of
//   function sum(n) { let t = 0; for (let i = 0; i < n; i++) t += i; return t; }
// as printed by viscosity_vir::print_func (the TypeScript printFunc prints
// the same text). %4 is the trivial phi the SSA builder removed: its slot
// stays in Module::values (op opaque, note "removed-trivial-phi") but no
// block lists it. The use lists are what viscosity_vir::build_uses returned
// for this function.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const SLOTS = ['param', '0', '0', 'phi', '(dead)', '<', 'phi', '+', '+ (un)', '1', '+'];
const SHORT = ['param', '0', '0', 'φ', '—', '<', 'φ', '+', 'u+', '1', '+'];
const BLOCKS = [
  { name: 'b0', ids: [0, 1, 2] },
  { name: 'b1', ids: [6, 3, 5] },
  { name: 'b2', ids: [7] },
  { name: 'b3', ids: [8, 9, 10] },
  { name: 'b4', ids: [] as number[], term: 'ret %6' },
];

type S = { slots: number[]; args?: number[]; block?: number; dead?: boolean; line: string; note: string };

const STATES: S[] = [
  { slots: [], line: 'values: Vec<Inst>  ·  %n is index n', note: 'The module owns one arena, values: a Vec holding every instruction of every function, in the order they were created. An instruction’s id is its index, so %5 is values[5]. Nothing else owns an Inst.' },
  { slots: [6, 3, 5], block: 1, line: 'b1.insts = [%6, %3, %5]', note: 'A block doesn’t hold instructions, only their ids, in execution order. b1 lists %6, %3, %5: ids follow creation order, not position, because the SSA builder made the phi for t after the one for i.' },
  { slots: [5], args: [3, 0], block: 1, line: 'm.inst(%5) → binop < %3, %0', note: 'Following an id is indexing: m.inst(v) is &self.values[v.index()]. The instruction’s operands are ids too, so walking the graph never needs a reference into the arena that outlives the call.' },
  { slots: [4], dead: true, line: '%4: opaque "removed-trivial-phi"', note: 'The builder made a phi for n at the loop header, saw that its only real operand was %0, rewired every use to %0, and took %4 out of b1. Its slot stays, so no id moves. all_insts walks blocks, so it never sees %4.' },
  { slots: [3], args: [5, 7, 8], line: 'uses[%3] = [%5, %7, %8]', note: 'build_uses fills a Vec of use lists indexed by the same ids. i (%3) is used by the compare, by t += i and by i++. A use can also be a terminator: uses[%6] ends with Term { block: b4 }, the return.' },
  { slots: [5], block: 1, line: 'm.inst(BlockId(1)) → E0308', note: 'Every arena has its own id type. ValueId indexes values, BlockId a function’s blocks, FuncId functions, BindingId bindings. Each is a u32 in a newtype, so handing a BlockId to m.inst does not compile.' },
];

export default function ArenaSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const sx = 12;
  const sw = 34;
  const sy = 40;
  return (
    <StepFrame title="An instruction arena with typed ids" steps={s} note={st.note}>
      <Svg w={400} h={260} title="The values arena of a VIR function, its blocks as lists of ids, and its use lists">
        <T x={sx} y={22} size={11} weight={700} fill={tok('brand')}>Module::values</T>
        <T x={388} y={22} size={11} anchor="end" fill={tok('muted')}>func sum(%0)</T>
        {SLOTS.map((_name, k) => {
          const x = sx + k * sw;
          const on = st.slots.includes(k);
          const arg = st.args?.includes(k);
          const dead = k === 4;
          const fill = on ? (st.dead ? tok('warn', 0.25) : tok('brand', 0.22)) : arg ? tok('accent', 0.18) : tok('panel');
          const stroke = on ? (st.dead ? tok('warn') : tok('brand')) : arg ? tok('accent') : tok('line');
          return (
            <g key={k}>
              <Box x={x} y={sy} w={sw - 3} h={40} r={3} fill={fill} stroke={stroke} dash={dead}>
                <T x={x + (sw - 3) / 2} y={sy + 12} size={11} mono anchor="middle" weight={700}>{`%${k}`}</T>
                <T x={x + (sw - 3) / 2} y={sy + 28} size={11} mono anchor="middle" fill={dead ? tok('muted') : undefined}>{SHORT[k]}</T>
              </Box>
            </g>
          );
        })}
        <T x={sx} y={sy + 58} size={11} fill={tok('muted')}>{st.dead ? 'dead slot: kept so that no id moves' : `${SLOTS.length} slots · index = id`}</T>
        <T x={sx} y={128} size={11} weight={700} fill={tok('accent')}>blocks (lists of ids)</T>
        {BLOCKS.map((b, k) => {
          const x = sx + k * 76;
          const on = st.block === k;
          const label = b.ids.length ? b.ids.map((i) => `%${i}`).join(' ') : b.term;
          return (
            <g key={b.name}>
              <Box x={x} y={140} w={70} h={42} r={4} fill={on ? tok('accent', 0.15) : tok('panel')} stroke={on ? tok('accent') : tok('line')}>
                <T x={x + 8} y={153} size={11} mono weight={700}>{b.name}</T>
                <T x={x + 8} y={170} size={11} mono>{label}</T>
              </Box>
              {on && b.ids.map((i) => (
                <Arrow key={i} x1={x + 35} y1={140} x2={sx + i * sw + (sw - 3) / 2} y2={sy + 42} color={tok('accent', 0.7)} width={1.4} />
              ))}
            </g>
          );
        })}
        <Box x={sx} y={204} w={376} h={34} r={4} fill={tok('panel')} stroke={tok('line')}>
          <T x={sx + 188} y={221} size={11} mono anchor="middle" fill={st.dead ? tok('warn') : tok('ink')}>{st.line}</T>
        </Box>
      </Svg>
    </StepFrame>
  );
}
