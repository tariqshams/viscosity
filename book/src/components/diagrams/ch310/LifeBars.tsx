import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 310: the one picture behind every lifetime error. Time runs left
// to right. The owner's bar is how long the value exists; the borrow's bar
// runs from where the reference is made to where it is last used. The
// borrow must fit inside the owner (top); if it sticks out (bottom), rustc
// reports E0597.
function Row({ y, label, x1, x2, col, bad }: { y: number; label: string; x1: number; x2: number; col: string; bad?: boolean }) {
  return (
    <g>
      <T x={8} y={y + 9} size={12} mono weight={700} fill={tok(col)}>{label}</T>
      <Box x={x1} y={y} w={x2 - x1} h={18} r={4} fill={tok(bad ? 'danger' : col, 0.25)} stroke={tok(bad ? 'danger' : col)} />
    </g>
  );
}

export default function LifeBars() {
  return (
    <Svg w={400} h={218} title="Two timelines: a borrow that fits inside its owner's life, and one that sticks out past it">
      <T x={8} y={12} size={12} weight={700} fill={tok('safe')}>Compiles: the borrow fits inside</T>
      <Row y={24} label="text" x1={86} x2={380} col="accent" />
      <Row y={50} label="&text" x1={150} x2={300} col="f4" />
      <T x={150} y={84} size={11} fill={tok('muted')}>made</T>
      <T x={300} y={84} size={11} anchor="end" fill={tok('muted')}>last used</T>

      <line x1={4} y1={102} x2={396} y2={102} stroke={tok('line')} strokeWidth={1} />

      <T x={8} y={120} size={12} weight={700} fill={tok('danger')}>E0597: the borrow sticks out</T>
      <Row y={132} label="text" x1={86} x2={240} col="accent" />
      <Row y={158} label="&text" x1={150} x2={340} col="f4" bad />
      <line x1={240} y1={128} x2={240} y2={184} stroke={tok('danger')} strokeWidth={2} strokeDasharray="4 3" />
      <T x={236} y={198} size={11} anchor="end" fill={tok('muted')}>text dropped here</T>
      <T x={340} y={198} size={11} anchor="end" fill={tok('danger')}>used here</T>
      <T x={392} y={212} size={11} anchor="end" fill={tok('muted')}>time runs left to right →</T>
    </Svg>
  );
}
