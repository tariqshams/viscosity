// Chapter 117: three ways to give a name a value, side by side. mut
// changes what is in ONE box (and the type stays fixed); shadowing makes
// a NEW box under the same name (and the type may change); const is fixed
// before the program runs, with its type written out.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

function Cell({ x, y, name, val, ty, faded, strike }: { x: number; y: number; name: string; val: string; ty: string; faded?: boolean; strike?: string }) {
  return (
    <g opacity={faded ? 0.4 : 1}>
      <T x={x + 50} y={y} size={13} mono weight={700} anchor="middle">{name}</T>
      <Box x={x} y={y + 8} w={100} h={42} fill={tok('panel')} stroke={tok('ink', 0.5)}>
        {strike && <T x={x + 22} y={y + 26} size={12} mono anchor="middle" fill={tok('muted')}>{strike}</T>}
        {strike && <line x1={x + 14} y1={y + 26} x2={x + 30} y2={y + 26} stroke={tok('danger')} strokeWidth={1.5} />}
        <T x={x + 50} y={y + 26} size={15} mono weight={700} anchor="middle" fill={tok('f1')}>{val}</T>
        <T x={x + 50} y={y + 42} size={11} mono anchor="middle" fill={tok('muted')}>{ty}</T>
      </Box>
    </g>
  );
}

export default function ShadowVsMut() {
  return (
    <Svg w={400} h={236} title="mut changes one box; shadowing makes a new box with the same name; const is fixed before the program runs">
      <T x={70} y={12} size={12} weight={700} anchor="middle" fill={tok('safe')}>let mut</T>
      <T x={70} y={28} size={11} mono anchor="middle">n = 1; n = 2</T>
      <Cell x={20} y={50} name="n" val="2" ty="i32" strike="1" />
      <T x={70} y={124} size={11} anchor="middle">same box,</T>
      <T x={70} y={139} size={11} anchor="middle">new value;</T>
      <T x={70} y={154} size={11} anchor="middle">type stays i32</T>

      <T x={200} y={12} size={12} weight={700} anchor="middle" fill={tok('accent')}>shadowing</T>
      <T x={200} y={28} size={11} mono anchor="middle">let x twice</T>
      <Cell x={150} y={50} name="x" val="5" ty="i32" faded />
      <Arrow x1={200} y1={102} x2={200} y2={124} color={tok('ink', 0.5)} />
      <Cell x={150} y={130} name="x" val={'"five"'} ty="&str" />
      <T x={200} y={198} size={11} anchor="middle">a new box with the</T>
      <T x={200} y={213} size={11} anchor="middle">same name; the type</T>
      <T x={200} y={228} size={11} anchor="middle">may change</T>

      <T x={330} y={12} size={12} weight={700} anchor="middle" fill={tok('brand')}>const</T>
      <T x={330} y={28} size={11} mono anchor="middle">MAX = 256</T>
      <Cell x={280} y={50} name="MAX" val="256" ty="usize" />
      <T x={330} y={124} size={11} anchor="middle">fixed before the</T>
      <T x={330} y={139} size={11} anchor="middle">program runs; the</T>
      <T x={330} y={154} size={11} anchor="middle">type is written out</T>
    </Svg>
  );
}
