// "Abstract interpretation and widening": the signs domain. Left, its
// lattice drawn the abstract-interpretation way up (⊥ "no value yet" at the
// bottom, ⊤ "any number" at the top, joins going up). Right, the abstract
// version of +.
import { Box, Svg, T, tok } from '../../viz/svg';

function N({ x, y, text, sub }: { x: number; y: number; text: string; sub?: string }) {
  return (
    <g>
      <Box x={x - 22} y={y - 13} w={44} h={26}>
        <T x={x} y={y} size={13} mono anchor="middle" weight={700}>{text}</T>
      </Box>
      {sub && <T x={x} y={y + 24} size={11} anchor="middle" fill={tok('muted')}>{sub}</T>}
    </g>
  );
}
const L = ({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) => (
  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={tok('ink', 0.4)} strokeWidth={1.4} />
);

const OPS = ['−', '0', '+'];
const PLUS = [
  ['−', '−', '⊤'],
  ['−', '0', '+'],
  ['⊤', '+', '+'],
];

export default function SignsFigure() {
  return (
    <Svg w={400} h={236} title="Left: the signs lattice: bottom (no value yet), then minus, zero and plus side by side, then top (any number). Right: the table for adding two signs: minus plus minus is minus, minus plus plus is top, zero plus a sign is that sign, plus plus plus is plus.">
      <T x={100} y={12} size={11} weight={700} anchor="middle" fill={tok('muted')}>THE SIGNS DOMAIN</T>
      {[40, 100, 160].map((x) => <L key={x} x1={100} y1={52} x2={x} y2={98} />)}
      {[40, 100, 160].map((x) => <L key={'b' + x} x1={x} y1={124} x2={100} y2={172} />)}
      <N x={100} y={40} text="⊤" />
      <T x={130} y={40} size={11} fill={tok('muted')}>any number</T>
      <N x={40} y={111} text="−" />
      <N x={100} y={111} text="0" />
      <N x={160} y={111} text="+" />
      <N x={100} y={185} text="⊥" />
      <T x={130} y={185} size={11} fill={tok('muted')}>no value yet</T>
      <T x={100} y={222} size={11} anchor="middle" fill={tok('muted')}>join goes up: 0 ⊔ + = ⊤</T>
      <line x1={222} y1={14} x2={222} y2={226} stroke={tok('line')} strokeWidth={1} strokeDasharray="4 4" />
      <T x={312} y={12} size={11} weight={700} anchor="middle" fill={tok('muted')}>ABSTRACT +</T>
      <T x={252} y={52} size={14} mono anchor="middle" weight={700}>+</T>
      {OPS.map((o, k) => (
        <T key={'c' + o} x={292 + k * 40} y={52} size={13} mono anchor="middle" weight={700} fill={tok('accent')}>{o}</T>
      ))}
      {OPS.map((o, r) => (
        <g key={'r' + o}>
          <T x={252} y={92 + r * 40} size={13} mono anchor="middle" weight={700} fill={tok('accent')}>{o}</T>
          {PLUS[r].map((v, c) => (
            <Box key={c} x={274 + c * 40} y={76 + r * 40} w={36} h={32} fill={v === '⊤' ? tok('danger', 0.1) : tok('panel')}>
              <T x={292 + c * 40} y={92 + r * 40} size={13} mono anchor="middle">{v}</T>
            </Box>
          ))}
        </g>
      ))}
      <T x={312} y={212} size={11} anchor="middle" fill={tok('muted')}>− plus +: could be anything</T>
    </Svg>
  );
}
