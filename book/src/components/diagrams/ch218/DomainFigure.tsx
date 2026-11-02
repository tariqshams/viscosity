// Chapter 217-b: the iteration domain of
//   for (i = 0; i < 5; i++) for (j = 0; j <= i; j++)
// drawn as whole-number points inside three inequalities.
import { Svg, T, tok } from '../../viz/svg';

const X0 = 70;
const Y0 = 200;
const D = 38;
const px = (j: number) => X0 + j * D;
const py = (i: number) => Y0 - i * D;

export default function DomainFigure() {
  const pts: [number, number][] = [];
  for (let i = 0; i < 5; i++) for (let j = 0; j <= i; j++) pts.push([i, j]);
  return (
    <Svg w={400} h={240} title="A triangle of points: 0 ≤ j ≤ i ≤ 4">
      <line x1={X0 - 14} y1={Y0} x2={X0 + 5.4 * D} y2={Y0} stroke={tok('ink', 0.4)} strokeWidth={1} />
      <line x1={X0} y1={Y0 + 14} x2={X0} y2={Y0 - 5.2 * D} stroke={tok('ink', 0.4)} strokeWidth={1} />
      <T x={X0 + 5.4 * D + 6} y={Y0} size={12} fill={tok('muted')}>j</T>
      <T x={X0} y={Y0 - 5.2 * D - 10} size={12} anchor="middle" fill={tok('muted')}>i</T>
      {[0, 1, 2, 3, 4].map((k) => (
        <g key={k}>
          <T x={px(k)} y={Y0 + 22} size={11} mono anchor="middle" fill={tok('muted')}>{k}</T>
          <T x={X0 - 22} y={py(k)} size={11} mono anchor="middle" fill={tok('muted')}>{k}</T>
        </g>
      ))}
      <polygon points={`${px(0)},${py(0)} ${px(0)},${py(4)} ${px(4)},${py(4)}`}
        fill={tok('brand', 0.12)} stroke={tok('brand')} strokeWidth={1.5} />
      {pts.map(([i, j]) => (
        <circle key={`${i},${j}`} cx={px(j)} cy={py(i)} r={6} fill={tok('brand')} />
      ))}
      <T x={262} y={70} size={12} mono>0 ≤ j</T>
      <T x={262} y={92} size={12} mono>j ≤ i</T>
      <T x={262} y={114} size={12} mono>i ≤ 4</T>
      <T x={262} y={142} size={11} fill={tok('muted')}>15 points:</T>
      <T x={262} y={160} size={11} fill={tok('muted')}>one per run</T>
      <T x={262} y={178} size={11} fill={tok('muted')}>of the body</T>
    </Svg>
  );
}
