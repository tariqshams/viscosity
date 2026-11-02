import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// V8's tiers as described in the V8 blog post on Maglev: everything starts
// as bytecode run by the Ignition interpreter, which records feedback; hot
// functions move up to Sparkplug, then the optimizing compilers Maglev and
// TurboFan, which speculate on that feedback. A broken assumption
// deoptimizes back to the bottom.
const TIERS = [
  { name: 'Ignition', sub: 'interprets bytecode; records feedback', c: 'muted' },
  { name: 'Sparkplug', sub: 'quick machine code, no guessing', c: 'f3' },
  { name: 'Maglev', sub: 'optimising: uses the feedback', c: 'f2' },
  { name: 'TurboFan', sub: 'optimising harder, for the hottest code', c: 'f1' },
];

export default function TierLadder() {
  const y = (k: number) => 196 - k * 56;
  return (
    <Svg w={400} h={262} title="V8's tiers from bottom to top: Ignition, Sparkplug, Maglev, TurboFan. A function moves up as it gets hot. A dashed arrow from the optimising tiers back down to Ignition shows deoptimisation.">
      {TIERS.map((t, k) => (
        <g key={t.name}>
          <Box x={20} y={y(k)} w={270} h={44} r={7} fill={tok(t.c, 0.13)} stroke={tok(t.c)}>
            <T x={32} y={y(k) + 15} size={14} weight={700}>{t.name}</T>
            <T x={32} y={y(k) + 32} size={11} fill={tok('muted')}>{t.sub}</T>
          </Box>
          {k > 0 && <Arrow x1={110} y1={y(k - 1) - 2} x2={110} y2={y(k) + 47} width={1.8} />}
        </g>
      ))}
      <T x={118} y={y(0) - 6} size={10} fill={tok('muted')}>gets hot</T>
      <Arrow x1={292} y1={y(3) + 22} x2={292} y2={y(0) + 22} bend={-0.7} width={1.8} color={tok('danger')} dash />
      <T x={362} y={118} size={11} weight={700} anchor="middle" fill={tok('danger')}>deopt:</T>
      <T x={362} y={134} size={11} anchor="middle" fill={tok('danger')}>a guess</T>
      <T x={362} y={150} size={11} anchor="middle" fill={tok('danger')}>was wrong</T>
      <T x={20} y={254} size={11} fill={tok('muted')}>every function starts at the bottom</T>
    </Svg>
  );
}
