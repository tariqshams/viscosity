import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 314: the tree for (1 + 2) * 3 built from
// enum Expr { Num(f64), Add(Box<Expr>, Box<Expr>), Mul(Box<Expr>, Box<Expr>) }.
// The root value lives in a local variable; every child sits in its own
// heap allocation, owned by exactly one Box in its parent. Sizes measured
// with std::mem::size_of on rustc 1.97 (64-bit): Box<Expr> 8, Expr 16.
function Node({ x, y, label, sub, col }: { x: number; y: number; label: string; sub: string; col: string }) {
  return (
    <Box x={x} y={y} w={108} h={40} fill={tok(col, 0.1)} stroke={tok(col)}>
      <T x={x + 54} y={y + 14} size={12} mono anchor="middle" weight={700}>{label}</T>
      <T x={x + 54} y={y + 30} size={11} mono anchor="middle" fill={tok('muted')}>{sub}</T>
    </Box>
  );
}

export default function BoxTree() {
  return (
    <Svg w={400} h={236} title="The expression (1 + 2) * 3 as a tree of boxes: the root on the stack, every child on the heap">
      <T x={8} y={14} size={11} weight={700} fill={tok('muted')}>STACK: let e = ...</T>
      <Node x={8} y={24} label="Mul" sub="Box | Box" col="brand" />
      <line x1={130} y1={6} x2={130} y2={230} stroke={tok('line')} strokeWidth={1} strokeDasharray="4 3" />
      <T x={392} y={14} size={11} weight={700} anchor="end" fill={tok('muted')}>HEAP: one allocation per Box</T>
      <Node x={150} y={70} label="Add" sub="Box | Box" col="accent" />
      <Node x={286} y={70} label="Num(3.0)" sub="16 bytes" col="safe" />
      <Node x={150} y={170} label="Num(1.0)" sub="16 bytes" col="safe" />
      <Node x={286} y={170} label="Num(2.0)" sub="16 bytes" col="safe" />
      <Arrow x1={60} y1={66} x2={168} y2={88} color={tok('brand')} />
      <Arrow x1={112} y1={34} x2={300} y2={70} color={tok('brand')} />
      <Arrow x1={190} y1={112} x2={200} y2={168} color={tok('accent')} />
      <Arrow x1={240} y1={110} x2={320} y2={168} color={tok('accent')} />
      <T x={8} y={92} size={11} fill={tok('muted')}>each Box: one</T>
      <T x={8} y={108} size={11} fill={tok('muted')}>8-byte pointer,</T>
      <T x={8} y={124} size={11} fill={tok('muted')}>one owner</T>
      <T x={8} y={210} size={11} fill={tok('muted')}>drop e: the whole</T>
      <T x={8} y={226} size={11} fill={tok('muted')}>tree is freed</T>
    </Svg>
  );
}
