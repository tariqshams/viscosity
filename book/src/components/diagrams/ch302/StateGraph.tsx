import { Arrow, Svg, T, tok } from '../../viz/svg';

// Chapter 302: the states of the lowered count(n) and the moves between
// them. Dashed arrows are yields: the call to next() ends there, and the
// next call picks up at the arrow's end.
const P: Record<number, [number, number]> = { 0: [50, 70], 1: [170, 70], 2: [300, 70], 3: [170, 168] };

function State({ k, label }: { k: number; label: string }) {
  const [x, y] = P[k];
  return (
    <g>
      <circle cx={x} cy={y} r={22} fill={k === 3 ? tok('safe', 0.15) : tok('brand', 0.12)} stroke={k === 3 ? tok('safe') : tok('brand')} strokeWidth={1.5} />
      <T x={x} y={y} size={15} mono weight={700} anchor="middle">{k}</T>
      <T x={x} y={y + 34} size={11} anchor="middle" fill={tok('muted')}>{label}</T>
    </g>
  );
}

export default function StateGraph() {
  return (
    <Svg w={400} h={210} title="Four states: 0 start, 1 loop test, 2 after the yield, 3 finished, with the moves between them">
      <Arrow x1={72} y1={70} x2={146} y2={70} color={tok('ink', 0.6)} />
      <T x={109} y={58} size={11} mono anchor="middle">i = 0</T>
      <Arrow x1={190} y1={58} x2={280} y2={58} color={tok('brand')} dash />
      <T x={235} y={44} size={11} mono anchor="middle" fill={tok('brand')}>yield i</T>
      <Arrow x1={280} y1={84} x2={192} y2={84} color={tok('ink', 0.6)} />
      <T x={235} y={98} size={11} mono anchor="middle">i++</T>
      <Arrow x1={170} y1={92} x2={170} y2={144} color={tok('ink', 0.6)} />
      <T x={178} y={122} size={11} mono>i ≥ n: return</T>
      <State k={0} label="start" />
      <State k={1} label="loop test" />
      <State k={2} label="after yield" />
      <State k={3} label="finished" />
      <T x={300} y={168} size={11} anchor="middle" fill={tok('muted')}>dashed: next() returns;</T>
      <T x={300} y={183} size={11} anchor="middle" fill={tok('muted')}>the next call starts there</T>
    </Svg>
  );
}
