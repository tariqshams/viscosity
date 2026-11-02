import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// Each BNF shorthand, unfolded into plain rules that say the same thing.
type S = { mark: string; short: string; plain: string[]; fits: string; note: string };

const STATES: S[] = [
  {
    mark: '|',
    short: 'item → NUMBER | "(" expr ")"',
    plain: ['item → NUMBER', 'item → "(" expr ")"'],
    fits: '7      (7)      ((7))',
    note: 'A bar | means “or”. One line with a bar is two rules for the same head, written once. Either rule may be used wherever an item is wanted.',
  },
  {
    mark: '?',
    short: 'letDecl → "let" IDENTIFIER ( "=" expr )? ";"',
    plain: ['letDecl → "let" IDENTIFIER ";"', 'letDecl → "let" IDENTIFIER "=" expr ";"'],
    fits: 'let x;      let x = 1;',
    note: 'A question mark makes the bracketed group optional: present once, or not at all. So it unfolds into two rules, one without the group and one with it.',
  },
  {
    mark: '*',
    short: 'expr → item ( "+" item )*',
    plain: ['expr → item more', 'more → "+" item more', 'more → ε'],
    fits: '1      1 + 2      1 + 2 + 3',
    note: 'A star means “zero or more times”. Unfolding it needs a new helper rule, here called more: either one more "+" item and then more again, or ε, which means nothing at all, the way out.',
  },
  {
    mark: '',
    short: 'stmt → "print" expr ";"',
    plain: ['stmt → "print" expr ";"'],
    fits: 'print 1 + 2;',
    note: 'A rule with no shorthand is already plain. Every shorthand can be unfolded like this, so they add no power to the notation; they only make grammars shorter and easier to read.',
  },
];

export default function ShorthandSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const plainTop = 96;
  return (
    <StepFrame title="Unfolding the shorthands" steps={s} note={st.note}>
      <Svg w={400} h={232} title="A rule written with a BNF shorthand, above, and the plain rules it stands for, below">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>WITH THE SHORTHAND</T>
        {st.mark && (
          <T x={392} y={12} size={11} anchor="end" weight={700} fill={tok('brand')}>{`the mark: ${st.mark}`}</T>
        )}
        <Box x={4} y={22} w={392} h={34} fill={tok('brand', 0.08)} stroke={tok('brand')}>
          <T x={14} y={39.5} size={12} mono>{st.short}</T>
        </Box>
        <T x={200} y={72} size={16} anchor="middle" fill={tok('muted')}>↓ means the same as</T>
        <T x={8} y={plainTop - 6} size={11} weight={700} fill={tok('muted')}>PLAIN RULES</T>
        {st.plain.map((line, k) => (
          <Box key={line} x={4} y={plainTop + 2 + k * 30} w={392} h={26} fill={tok('panel')} stroke={tok('ink', 0.4)}>
            <T x={14} y={plainTop + 15.5 + k * 30} size={12} mono>{line}</T>
          </Box>
        ))}
        <T x={8} y={200} size={11} weight={700} fill={tok('muted')}>SOME TOKEN ROWS THAT FIT</T>
        <T x={8} y={218} size={13} mono fill={tok('safe')}>{st.fits}</T>
      </Svg>
    </StepFrame>
  );
}
