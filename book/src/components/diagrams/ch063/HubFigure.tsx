import { Box, Svg, T, tok } from '../../viz/svg';

const LANGS = ['Drip', 'JS', 'Python'];
const TARGETS = ['VM', 'x86', 'Arm'];
const ys = [52, 102, 152];

function Node({ x, y, label, kind }: { x: number; y: number; label: string; kind: 'brand' | 'accent' }) {
  return (
    <Box x={x} y={y - 15} w={52} h={30} r={6} fill={tok(kind, 0.12)} stroke={tok(kind)}>
      <T x={x + 26} y={y} size={12} weight={700} anchor="middle">{label}</T>
    </Box>
  );
}

/** M x N direct translators (left) against M + N pieces through one IR (right). */
export default function HubFigure() {
  return (
    <Svg w={400} h={214} title="Left: three languages joined directly to three targets by nine lines. Right: the three languages join one IR in the middle, which joins the three targets, six lines in all.">
      <T x={97} y={14} size={12} weight={700} anchor="middle" fill={tok('muted')}>DIRECT: 3 × 3 = 9</T>
      {ys.map((a) => ys.map((b) => (
        <line key={`${a}-${b}`} x1={58} y1={a} x2={140} y2={b} stroke={tok('ink', 0.45)} strokeWidth={1.5} />
      )))}
      {LANGS.map((l, k) => <Node key={l} x={6} y={ys[k]} label={l} kind="brand" />)}
      {TARGETS.map((l, k) => <Node key={l} x={140} y={ys[k]} label={l} kind="accent" />)}

      <line x1={200} y1={30} x2={200} y2={180} stroke={tok('line')} strokeWidth={1.5} strokeDasharray="4 4" />

      <T x={303} y={14} size={12} weight={700} anchor="middle" fill={tok('muted')}>THROUGH AN IR: 3 + 3 = 6</T>
      {ys.map((a) => (
        <g key={a}>
          <line x1={262} y1={a} x2={286} y2={102} stroke={tok('ink', 0.45)} strokeWidth={1.5} />
          <line x1={320} y1={102} x2={342} y2={a} stroke={tok('ink', 0.45)} strokeWidth={1.5} />
        </g>
      ))}
      {LANGS.map((l, k) => <Node key={l} x={210} y={ys[k]} label={l} kind="brand" />)}
      <Box x={286} y={84} w={34} h={36} r={6} fill={tok('warn', 0.16)} stroke={tok('warn')}>
        <T x={303} y={102} size={12} weight={700} anchor="middle">IR</T>
      </Box>
      {TARGETS.map((l, k) => <Node key={l} x={342} y={ys[k]} label={l} kind="accent" />)}

      <T x={97} y={196} size={11} anchor="middle" fill={tok('muted')}>one translator per pair</T>
      <T x={303} y={196} size={11} anchor="middle" fill={tok('muted')}>one piece per language or target</T>
    </Svg>
  );
}
