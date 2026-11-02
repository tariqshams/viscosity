// The two big-step rules for || beside the interpreter's code for it:
// each premise is a recursive call, and the truthiness test chooses the
// rule.
import { Box, Svg, T, tok } from '../../viz/svg';

export default function RuleToCode() {
  const mono = (x: number, y: number, s: string, fill?: string, weight?: number) => (
    <T x={x} y={y} size={12} mono fill={fill} weight={weight}>{s.replace(/ /g, ' ')}</T>
  );
  return (
    <Svg w={400} h={262} title="Top: the rules OrL and OrR. Bottom: the interpreter's case for logical expressions. The first premise of both rules, evaluating e₁, matches the first line of code; the truthiness test picks the rule; the extra premise of OrR matches the second recursive call.">
      <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>THE RULES</T>
      <Box x={4} y={20} w={392} h={104}>
        {mono(14, 38, 'ρ ⊢ e₁ ⇓ v₁', tok('brand'), 700)}
        {mono(110, 38, 'v₁ truthy', tok('accent'), 700)}
        <line x1={12} y1={50} x2={226} y2={50} stroke={tok('ink', 0.7)} />
        <T x={232} y={50} size={11} weight={700} fill={tok('muted')}>OrL</T>
        {mono(14, 62, 'ρ ⊢ e₁ || e₂ ⇓ v₁')}
        {mono(14, 86, 'ρ ⊢ e₁ ⇓ v₁', tok('brand'), 700)}
        {mono(110, 86, 'v₁ falsey', tok('accent'), 700)}
        {mono(198, 86, 'ρ ⊢ e₂ ⇓ v₂', tok('safe'), 700)}
        <line x1={12} y1={98} x2={300} y2={98} stroke={tok('ink', 0.7)} />
        <T x={306} y={98} size={11} weight={700} fill={tok('muted')}>OrR</T>
        {mono(14, 112, 'ρ ⊢ e₁ || e₂ ⇓ v₂')}
      </Box>
      <T x={8} y={142} size={11} weight={700} fill={tok('muted')}>THE INTERPRETER (case 'logical', for ||)</T>
      <Box x={4} y={150} w={392} h={76}>
        {mono(14, 168, 'const left = this.evaluate(e.left);', tok('brand'), 700)}
        {mono(14, 190, 'return isTruthy(left)', tok('accent'), 700)}
        {mono(14, 212, '  ? left : this.evaluate(e.right);', tok('safe'), 700)}
      </Box>
      <T x={200} y={246} size={11} anchor="middle" fill={tok('muted')}>a premise is a recursive call; the test picks the rule</T>
    </Svg>
  );
}
