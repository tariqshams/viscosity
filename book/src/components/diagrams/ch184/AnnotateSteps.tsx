// The parse tree of 3 * (4 + 5) under the grammar E → E + T | T,
// T → T * F | F, F → ( E ) | num, with the synthesised attribute val
// filled in one node at a time, children before parents.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Svg, T, tok } from '../../viz/svg';
import { type N, drawTree, layout } from './atree';

const leaf = (id: string, label: string): N => ({ id, label, term: true });
const TREE: N = {
  id: 'E0', label: 'E', kids: [
    { id: 'T1', label: 'T', kids: [
      { id: 'T2', label: 'T', kids: [{ id: 'F4', label: 'F', kids: [leaf('n3', '3')] }] },
      leaf('times', '*'),
      { id: 'F3', label: 'F', kids: [
        leaf('lp', '('),
        { id: 'E5', label: 'E', kids: [
          { id: 'E6', label: 'E', kids: [{ id: 'T8', label: 'T', kids: [{ id: 'F9', label: 'F', kids: [leaf('n4', '4')] }] }] },
          leaf('plus', '+'),
          { id: 'T7', label: 'T', kids: [{ id: 'F10', label: 'F', kids: [leaf('n5', '5')] }] },
        ] },
        leaf('rp', ')'),
      ] },
    ] },
  ],
};
const PLACED = layout(TREE, 4, 380, 14, 27);

type S = { at?: string; val: Record<string, string>; rule: string; note: string };
const ORDER: [string, string, string, string][] = [
  ['F4', '3', 'F.val = num.lexval', 'The first node whose children are all known is the F above the 3. Its rule, F → num, copies the number the scanner read: F.val = 3.'],
  ['T2', '3', 'T.val = F.val', 'Its parent T used the rule T → F, whose semantic rule copies the value up unchanged: T.val = 3.'],
  ['F9', '4', 'F.val = num.lexval', 'The left T is finished, but the right side of * is not, so the walk goes down into the brackets. The F over 4 gets val = 4.'],
  ['T8', '4', 'T.val = F.val', 'Copied up by T → F: 4.'],
  ['E6', '4', 'E.val = T.val', 'And again by E → T: the left operand of + is worth 4.'],
  ['F10', '5', 'F.val = num.lexval', 'Now the right operand of +: the F over 5 gets 5.'],
  ['T7', '5', 'T.val = F.val', 'Copied up by T → F: 5.'],
  ['E5', '9', 'E.val = E₁.val + T.val', 'Both children of the inner E are known, so its rule can run: E → E₁ + T, so E.val = 4 + 5 = 9. The + token itself carries no value; it only chose the rule.'],
  ['F3', '9', 'F.val = E.val', 'F → ( E ) passes the inner value through: the brackets did their work by shaping the tree, so F.val = 9.'],
  ['T1', '27', 'T.val = T₁.val × F.val', 'Now T → T₁ * F has both children: 3 × 9 = 27.'],
  ['E0', '27', 'E.val = T.val', 'The root copies it: the whole expression is worth 27. Every node was visited after its children, exactly the order of a post-order walk.'],
];
const STATES: S[] = [{ val: {}, rule: '', note: 'Each node will carry an attribute called val. No value is known yet: only the tree exists. A node can work out its val once all its children have theirs.' }];
for (const [id, v, rule, note] of ORDER) {
  STATES.push({ at: id, val: { ...STATES[STATES.length - 1].val, [id]: v }, rule, note });
}

export default function AnnotateSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Filling in val, from the leaves up" steps={s} note={st.note}>
      <Svg w={400} h={246} title="The parse tree of 3 * (4 + 5), with each nonterminal's val written beside it as it is computed">
        {drawTree(PLACED, st.val, st.at)}
        <T x={396} y={236} size={12} mono anchor="end" weight={700} fill={tok('brand')}>{st.rule}</T>
      </Svg>
    </StepFrame>
  );
}
