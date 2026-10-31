import { StepFrame, useSteps } from '../../viz/stepper';
import { Svg, T, tok } from '../../viz/svg';
import FormChips from './FormChips';
import { RULES, apply, ruleText } from './grammar';

const USED = [0, 1, 2, 3, 4, 1, 2, 3, 3];
const NOTES = [
  'Every derivation starts from one nonterminal, here stmt. The underline marks the leftmost nonterminal: the one we replace next.',
  'stmt has one rule, so stmt becomes print expr ;. Two terminals appeared: they are real tokens and will never change again.',
  'expr has two rules. We pick expr → expr "+" item, because the sentence we want has a + in it. Notice expr is still there: the rule mentions itself.',
  'Now the leftmost expr takes its other rule, expr → item. This is the choice that stops the growth on the left.',
  'item → NUMBER. NUMBER is a terminal: it stands for any number token, such as 1.',
  'The next item takes item → "(" expr ")". A whole new expr sits inside the brackets, so everything can start again in there.',
  'Inside the brackets, expr → expr "+" item once more.',
  'And expr → item, to stop.',
  'item → NUMBER.',
  'The last item → NUMBER. No nonterminals are left, so this is a sentence of the grammar. It matches the tokens of print 1 + (2 + 3);.',
];

const FORMS: string[][] = [['stmt']];
for (const r of USED) FORMS.push(apply(FORMS[FORMS.length - 1], RULES[r]));

const STATES = FORMS.map((form, k) => ({ form, rule: k === 0 ? null : USED[k - 1], note: NOTES[k] }));

export default function DeriveSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Deriving a sentence" steps={s} note={st.note}>
      <Svg w={400} h={210} title="The five rules of a small grammar, with the rule used in this step highlighted, and the current string of symbols">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>THE RULES</T>
        {RULES.map((r, k) => (
          <g key={k}>
            {st.rule === k && <rect x={4} y={22 + k * 20} width={300} height={18} rx={4} fill={tok('brand', 0.15)} stroke={tok('brand')} />}
            <T x={12} y={31 + k * 20} size={12.5} mono weight={st.rule === k ? 700 : 400}>{ruleText(r)}</T>
          </g>
        ))}
        <T x={8} y={136} size={11} weight={700} fill={tok('muted')}>STEP {s.i} OF {STATES.length - 1}: THE STRING SO FAR</T>
        <FormChips form={st.form} y={150} />
      </Svg>
    </StepFrame>
  );
}
