import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 315-b: a newtype index costs nothing. A bare u32, engine/rust's
// ValueId(u32) and drip-rs's Gc<T> (a u32 plus a zero-sized PhantomData)
// are all 4 bytes (size_of on rustc 1.97); only the type differs.
function Row({ y, name, sub, col }: { y: number; name: string; sub: string; col: string }) {
  return (
    <g>
      <T x={8} y={y + 16} size={12} mono weight={700} fill={tok(col)}>{name}</T>
      <Box x={196} y={y} w={120} h={32} fill={tok(col, 0.12)} stroke={tok(col)}>
        <T x={256} y={y + 16} size={12} mono anchor="middle">u32</T>
      </Box>
      <T x={392} y={y + 16} size={11} anchor="end" fill={tok('muted')}>4 bytes</T>
      <T x={8} y={y + 32} size={11} fill={tok('muted')}>{sub}</T>
    </g>
  );
}

export default function IdBox() {
  return (
    <Svg w={400} h={176} title="A u32, a ValueId and a Gc handle all take the same 4 bytes">
      <Row y={6} name="u32" sub="any number at all" col="muted" />
      <Row y={60} name="ValueId(u32)" sub="only a VIR value's number" col="f1" />
      <Row y={114} name="Gc<ObjClass>" sub="index + PhantomData (0 bytes)" col="f2" />
    </Svg>
  );
}
