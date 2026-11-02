// Chapter 409: why the one-line TypeScript copy is E0502 in Rust, and how
// drip-rs's Inherit arm (book/companion/rust/src/vm.rs) splits it in two:
// clone the superclass's Table while holding a shared borrow, let that
// borrow end, then borrow the heap mutably to add_all into the subclass.
// The error text is rustc 1.97's, for the toy heap shown in the chapter.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

function Heap({ y, aHot, bHot }: { y: number; aHot: string; bHot: string }) {
  return (
    <g>
      <Box x={150} y={y} w={240} h={56} r={5} fill={tok('paper')} stroke={tok('line')}>
        <T x={160} y={y + 12} size={11} mono fill={tok('muted')}>heap (one value)</T>
        <Box x={160} y={y + 22} w={100} h={26} r={3} fill={aHot} stroke={tok('line')}>
          <T x={210} y={y + 35} size={12} mono anchor="middle">A.methods</T>
        </Box>
        <Box x={278} y={y + 22} w={100} h={26} r={3} fill={bHot} stroke={tok('line')}>
          <T x={328} y={y + 35} size={12} mono anchor="middle">B.methods</T>
        </Box>
      </Box>
    </g>
  );
}

export default function BorrowSplit() {
  return (
    <Svg w={400} h={300} title="One line borrows the whole heap twice and is rejected; drip-rs clones first, then writes">
      <T x={4} y={12} size={12} weight={700}>One line, as in TypeScript</T>
      <Heap y={26} aHot={tok('accent', 0.18)} bHot={tok('danger', 0.18)} />
      <Box x={4} y={30} w={130} h={22} r={3} fill={tok('accent', 0.14)} stroke={tok('accent')}>
        <T x={10} y={41} size={11} mono>&amp;h[sup] (shared)</T>
      </Box>
      <Box x={4} y={58} w={130} h={22} r={3} fill={tok('danger', 0.14)} stroke={tok('danger')}>
        <T x={10} y={69} size={11} mono>&amp;mut h[sub]</T>
      </Box>
      <Arrow x1={134} y1={41} x2={158} y2={54} color={tok('accent')} />
      <Arrow x1={134} y1={69} x2={158} y2={62} color={tok('danger')} />
      <T x={4} y={100} size={12} mono weight={700} fill={tok('danger')}>error[E0502]: both borrow all of h</T>
      <T x={4} y={118} size={11} fill={tok('muted')}>rustc cannot tell that sub and sup are different slots.</T>

      <T x={4} y={150} size={12} weight={700}>drip-rs: clone, then write</T>
      <Heap y={164} aHot={tok('accent', 0.18)} bHot={tok('safe', 0.18)} />
      <Box x={4} y={168} w={130} h={22} r={3} fill={tok('accent', 0.14)} stroke={tok('accent')}>
        <T x={10} y={179} size={11} mono>1. .clone()</T>
      </Box>
      <Arrow x1={158} y1={193} x2={134} y2={181} color={tok('accent')} />
      <Box x={4} y={198} w={130} h={22} r={3} fill={tok('safe', 0.14)} stroke={tok('safe')}>
        <T x={10} y={209} size={11} mono>2. add_all(&amp;copy)</T>
      </Box>
      <Arrow x1={134} y1={209} x2={276} y2={204} color={tok('safe')} bend={-0.2} />
      <T x={4} y={240} size={11} fill={tok('muted')}>Step 1&apos;s shared borrow ends at its semicolon,</T>
      <T x={4} y={256} size={11} fill={tok('muted')}>so step 2 may borrow the heap mutably. The copy</T>
      <T x={4} y={272} size={11} fill={tok('muted')}>is ordinary Rust memory, dropped at the end of</T>
      <T x={4} y={288} size={11} fill={tok('muted')}>the arm; it is never a Drip object.</T>
    </Svg>
  );
}
