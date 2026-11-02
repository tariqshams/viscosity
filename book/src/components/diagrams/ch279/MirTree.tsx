import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 279: the decision tree rustc built for the chapter's match on
// (a, b), read off its MIR (rustc 1.97, --emit=mir -O). Each box is a MIR
// basic block; the labels on the edges are discriminant values (0 is
// None, 1 is Some).
const B: Record<string, { x: number; y: number; t: string; s: string; leaf?: boolean }> = {
  bb0: { x: 200, y: 30, t: 'bb0', s: 'switch on a' },
  bb4: { x: 320, y: 100, t: 'bb4', s: 'return 0', leaf: true },
  bb2: { x: 110, y: 100, t: 'bb2', s: 'switch on b' },
  bb5: { x: 60, y: 176, t: 'bb5', s: 'return x ^ y', leaf: true },
  bb1: { x: 200, y: 176, t: 'bb1', s: 'return 1', leaf: true },
};

export default function MirTree() {
  const box = (k: string) => {
    const b = B[k];
    return (
      <Box key={k} x={b.x - 58} y={b.y - 20} w={116} h={40} fill={b.leaf ? tok('safe', 0.15) : tok('brand', 0.12)} stroke={b.leaf ? tok('safe') : tok('brand')}>
        <T x={b.x} y={b.y - 7} size={11} mono anchor="middle" fill={tok('muted')}>{b.t}</T>
        <T x={b.x} y={b.y + 9} size={12} mono anchor="middle">{b.s}</T>
      </Box>
    );
  };
  return (
    <Svg w={400} h={214} title="rustc's decision tree: switch on a; None returns 0; Some switches on b; Some returns x xor y, None returns 1">
      <Arrow x1={180} y1={50} x2={128} y2={80} color={tok('ink', 0.5)} />
      <T x={140} y={58} size={11} mono anchor="end" fill={tok('muted')}>1 (Some)</T>
      <Arrow x1={222} y1={50} x2={300} y2={80} color={tok('ink', 0.5)} />
      <T x={268} y={58} size={11} mono fill={tok('muted')}>0 (None)</T>
      <Arrow x1={92} y1={120} x2={70} y2={156} color={tok('ink', 0.5)} />
      <T x={72} y={136} size={11} mono anchor="end" fill={tok('muted')}>1</T>
      <Arrow x1={130} y1={120} x2={186} y2={156} color={tok('ink', 0.5)} />
      <T x={166} y={136} size={11} mono fill={tok('muted')}>0</T>
      {Object.keys(B).map(box)}
      <T x={200} y={208} size={11} anchor="middle" fill={tok('muted')}>any other discriminant goes to bb3: unreachable</T>
    </Svg>
  );
}
