// Chapter 358: who holds an instruction. In the TypeScript VIR
// (engine/ts/packages/core/src/vir.ts) Block.insts is Inst[] and
// Module.values is Inst[]: two references to the same objects. In the
// Rust VIR (engine/rust/crates/vir/src/lib.rs) Module::values: Vec<Inst>
// owns every instruction and Block::insts: Vec<ValueId> lists ids. The
// ids are those of block b1 of sum(n) (see ArenaSteps).
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

export default function TwoOwners() {
  const objs = [6, 3, 5];
  return (
    <Svg w={400} h={250} title="TypeScript: a block and the module both point at the same instruction objects. Rust: the module owns the instructions, and the block lists their numbers.">
      <T x={100} y={14} size={12} weight={700} anchor="middle" fill={tok('accent')}>TypeScript</T>
      <T x={300} y={14} size={12} weight={700} anchor="middle" fill={tok('brand')}>Rust</T>
      <line x1={200} y1={6} x2={200} y2={244} stroke={tok('line')} strokeWidth={1.5} />
      {/* TypeScript side */}
      <Box x={8} y={28} w={84} h={30} fill={tok('panel')} stroke={tok('accent')}>
        <T x={50} y={43} size={11} mono anchor="middle">b1.insts</T>
      </Box>
      <Box x={108} y={28} w={84} h={30} fill={tok('panel')} stroke={tok('accent')}>
        <T x={150} y={43} size={11} mono anchor="middle">m.values</T>
      </Box>
      {objs.map((v, k) => {
        const y = 100 + k * 44;
        return (
          <g key={v}>
            <Box x={60} y={y} w={80} h={30} fill={tok('accent', 0.14)} stroke={tok('accent')}>
              <T x={100} y={y + 15} size={11} mono anchor="middle">{`Inst %${v}`}</T>
            </Box>
            <Arrow x1={50} y1={60} x2={64} y2={y} color={tok('accent', 0.8)} width={1.3} />
            <Arrow x1={150} y1={60} x2={136} y2={y} color={tok('accent', 0.8)} width={1.3} />
          </g>
        );
      })}
      <T x={100} y={238} size={11} anchor="middle" fill={tok('muted')}>two references, one object</T>
      {/* Rust side */}
      <Box x={212} y={28} w={180} h={30} fill={tok('panel')} stroke={tok('brand')}>
        <T x={222} y={43} size={11} mono>b1.insts = [6, 3, 5]</T>
      </Box>
      <T x={212} y={84} size={11} mono fill={tok('muted')}>m.values: Vec&lt;Inst&gt;</T>
      {[3, 4, 5, 6].map((v, k) => {
        const y = 96 + k * 32;
        const on = v !== 4;
        return (
          <g key={v}>
            <T x={232} y={y + 13} size={11} mono anchor="end" fill={tok('muted')}>{v}</T>
            <Box x={238} y={y} w={154} h={26} r={3} dash={!on} fill={on ? tok('brand', 0.14) : tok('panel')} stroke={on ? tok('brand') : tok('line')}>
              <T x={246} y={y + 13} size={11} mono fill={on ? tok('ink') : tok('muted')}>{on ? `Inst %${v}` : 'dead, kept'}</T>
            </Box>
          </g>
        );
      })}
      <T x={300} y={238} size={11} anchor="middle" fill={tok('muted')}>one owner; the block holds numbers</T>
    </Svg>
  );
}
