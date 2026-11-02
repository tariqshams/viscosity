// One inference rule, labelled: the premises above the line, the
// conclusion below it, the rule's name beside it, and how to read it.
import { Arrow, Svg, T, tok } from '../../viz/svg';

export default function RuleAnatomy() {
  return (
    <Svg w={400} h={200} title="The rule T-Plus. Above the line, two premises: Γ ⊢ e₁ : Num and Γ ⊢ e₂ : Num. Below the line, the conclusion Γ ⊢ e₁ + e₂ : Num. The name T-Plus is to the right of the line. Read: if both premises hold, the conclusion holds.">
      <T x={110} y={50} size={15} mono anchor="middle" fill={tok('brand')}>Γ ⊢ e₁ : Num</T>
      <T x={250} y={50} size={15} mono anchor="middle" fill={tok('brand')}>Γ ⊢ e₂ : Num</T>
      <line x1={40} y1={72} x2={320} y2={72} stroke={tok('ink')} strokeWidth={2} />
      <T x={328} y={72} size={13} weight={700} fill={tok('accent')}>T-Plus</T>
      <T x={180} y={96} size={15} mono anchor="middle" fill={tok('safe')}>Γ ⊢ e₁ + e₂ : Num</T>
      <T x={110} y={18} size={11} anchor="middle" weight={700} fill={tok('brand')}>premise 1</T>
      <T x={250} y={18} size={11} anchor="middle" weight={700} fill={tok('brand')}>premise 2</T>
      <Arrow x1={110} y1={26} x2={110} y2={38} color={tok('brand')} />
      <Arrow x1={250} y1={26} x2={250} y2={38} color={tok('brand')} />
      <T x={180} y={124} size={11} anchor="middle" weight={700} fill={tok('safe')}>conclusion</T>
      <T x={364} y={92} size={11} anchor="middle" fill={tok('accent')}>its name</T>
      <T x={200} y={156} size={12} anchor="middle" fill={tok('ink')}>“If e₁ is a Num and e₂ is a Num,</T>
      <T x={200} y={174} size={12} anchor="middle" fill={tok('ink')}>in the same Γ, then e₁ + e₂ is a Num.”</T>
    </Svg>
  );
}
