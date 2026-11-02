// Chapter 226: progressive lowering in MLIR, after the Toy tutorial's
// chapter 5. A high-level dialect is partly lowered to lower-level dialects
// that live side by side in one function (toy.print stays for now), and
// later everything is lowered to the LLVM dialect.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const rung = (y: number, title: string, ops: string, c: string) => (
  <Box x={20} y={y} w={300} h={50} fill={tok(c, 0.1)} stroke={tok(c)}>
    <T x={34} y={y + 16} size={12.5} weight={700}>{title}</T>
    <T x={34} y={y + 35} size={11.5} mono fill={tok('muted')}>{ops}</T>
  </Box>
);

export default function LoweringLadder() {
  return (
    <Svg w={400} h={262} title="Three rungs: the toy dialect, then affine, arith and memref with toy.print kept, then the LLVM dialect">
      {rung(8, 'toy: whole tensors', 'toy.transpose  toy.mul  toy.print', 'brand')}
      <Arrow x1={170} y1={60} x2={170} y2={96} />
      <T x={182} y={78} size={11} fill={tok('muted')}>partial lowering</T>
      {rung(98, 'affine + arith + memref (+ toy)', 'affine.for  arith.mulf  toy.print', 'accent')}
      <Arrow x1={170} y1={150} x2={170} y2={186} />
      <T x={182} y={168} size={11} fill={tok('muted')}>lower the rest</T>
      {rung(188, 'llvm: close to the machine', 'llvm.load  llvm.call  llvm.br', 'safe')}
      <T x={332} y={33} size={11} fill={tok('muted')}>high</T>
      <T x={332} y={213} size={11} fill={tok('muted')}>low</T>
      <line x1={350} y1={44} x2={350} y2={200} stroke={tok('line')} strokeWidth={1.5} />
      <T x={200} y={252} size={11} anchor="middle" fill={tok('muted')}>Each step rewrites some operations; the rest wait.</T>
    </Svg>
  );
}
