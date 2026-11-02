// Chapter 371: Tukey's fences as criterion uses them (criterion.rs book,
// "Analysis Process"): samples outside Q1 - 1.5 IQR or Q3 + 1.5 IQR are
// mild outliers, outside 3 IQR severe; they are reported, not dropped.
// The sample values are illustrative timings in nanoseconds.
import { Svg, T, tok } from '../../viz/svg';

const SAMPLES = [658, 660, 661, 662, 663, 664, 664, 665, 666, 667, 668, 669, 670, 671, 673, 684, 700];
// Quartiles by nearest rank (index n/4 and 3n/4 of the sorted 17).
const Q1 = 663;
const Q3 = 669;
const IQR = Q3 - Q1;

export default function Fences() {
  const lo = 630;
  const hi = 710;
  const x = (v: number) => 20 + ((v - lo) / (hi - lo)) * 360;
  const mild = [Q1 - 1.5 * IQR, Q3 + 1.5 * IQR];
  const severe = [Q1 - 3 * IQR, Q3 + 3 * IQR];
  const kind = (v: number) => (v < severe[0] || v > severe[1] ? 'severe' : v < mild[0] || v > mild[1] ? 'mild' : 'ok');
  return (
    <Svg w={400} h={150} title="A number line of sample times with the quartiles, the 1.5 and 3 IQR fences, and two samples flagged as outliers">
      <line x1={x(lo)} y1={70} x2={x(hi)} y2={70} stroke={tok('line')} strokeWidth={1.5} />
      <rect x={x(Q1)} y={56} width={x(Q3) - x(Q1)} height={28} rx={3} fill={tok('brand', 0.15)} stroke={tok('brand')} />
      <T x={(x(Q1) + x(Q3)) / 2} y={44} size={11} anchor="middle" fill={tok('brand')}>Q1 to Q3 (IQR = {IQR})</T>
      {[...mild, ...severe].map((f, k) => (
        <g key={k}>
          <line x1={x(f)} y1={48} x2={x(f)} y2={92} stroke={tok(k < 2 ? 'warn' : 'danger')} strokeWidth={2} strokeDasharray="4 3" />
          <T x={x(f)} y={104} size={11} mono anchor="middle" fill={tok(k < 2 ? 'warn' : 'danger')}>{f}</T>
        </g>
      ))}
      {SAMPLES.map((v, k) => {
        const kd = kind(v);
        return <circle key={k} cx={x(v)} cy={70} r={4} fill={tok(kd === 'ok' ? 'f1' : kd === 'mild' ? 'warn' : 'danger')} opacity={0.85} />;
      })}
      <T x={x(684)} y={20} size={11} anchor="middle" fill={tok('warn')}>mild</T>
      <T x={x(700)} y={32} size={11} anchor="middle" fill={tok('danger')}>severe</T>
      <T x={20} y={124} size={11} fill={tok('warn')}>dashes: 1.5 × IQR fences</T>
      <T x={200} y={124} size={11} fill={tok('danger')}>3 × IQR fences</T>
      <T x={20} y={142} size={11} fill={tok('muted')}>sample times in ns (illustrative)</T>
    </Svg>
  );
}
