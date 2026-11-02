import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 266: how a type checker turns overloaded calls into calls with
// a dictionary argument (Wadler and Blott's translation), and how a
// dictionary for lists is built from the dictionary for numbers.
type S = { wrote: string; need: string; emit: string; run: string; dicts: number; note: string };

const STATES: S[] = [
  { wrote: 'max(3, 7)', need: '', emit: '', run: '', dicts: 0, note: 'You write max(3, 7). The type of max says it works for any type a that has a less-than: Ord a ⇒ a → a → a.' },
  { wrote: 'max(3, 7)', need: 'a = number, so Ord number', emit: '', run: '', dicts: 1, note: 'The type checker works out that a is number here, so this call needs the Ord operations for numbers.' },
  { wrote: 'max(3, 7)', need: 'Ord number: ordNum', emit: 'max(ordNum, 3, 7)', run: '', dicts: 1, note: 'It finds the instance for number, a record called ordNum, and passes it as an extra first argument. Your code never mentions it.' },
  { wrote: 'max(3, 7)', need: 'Ord number: ordNum', emit: 'max(ordNum, 3, 7)', run: 'd.lt(3, 7) is true, so 7', dicts: 1, note: 'At run time, max calls d.lt, which is ordNum.lt, the plain numeric <. One compiled max serves every type: only the dictionary changes.' },
  { wrote: 'max([1, 2], [1, 3])', need: 'a = list of number', emit: '', run: '', dicts: 1, note: 'Now the arguments are lists of numbers. Nobody wrote a dictionary for exactly that type.' },
  { wrote: 'max([1, 2], [1, 3])', need: 'Ord a ⇒ Ord (list a)', emit: 'max(ordList(ordNum), …)', run: '', dicts: 2, note: 'But there is a rule: if a has Ord, so does a list of a. The rule is a function, ordList, from a dictionary to a dictionary, so the compiler calls it with ordNum.' },
  { wrote: 'max([1, 2], [1, 3])', need: 'Ord a ⇒ Ord (list a)', emit: 'max(ordList(ordNum), …)', run: '1 = 1, then 2 < 3: [1, 3]', dicts: 2, note: 'Running, the list dictionary’s lt compares element by element, using the number dictionary inside it. Dictionaries nest exactly as the types do.' },
];

const DICTS = [
  'ordNum = { lt: (a, b) => a < b }',
  'ordList(d) = { lt: compare items with d.lt }',
];

export default function DictSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const row = (y: number, label: string, text: string, hi: boolean) => (
    <g>
      <T x={6} y={y} size={11} weight={700} fill={tok('muted')}>{label}</T>
      <Box x={6} y={y + 8} w={388} h={28} fill={hi ? tok('brand', 0.12) : 'transparent'} stroke={text ? tok('ink', 0.5) : tok('line')} dash={!text}>
        <T x={14} y={y + 22} size={12} mono>{text}</T>
      </Box>
    </g>
  );
  return (
    <StepFrame title="Dictionary passing, inserted by the type checker" steps={s} note={st.note}>
      <Svg w={400} h={270} title="What you wrote, what the type checker needs and inserts, what runs, and the dictionaries in play">
        {row(10, 'YOU WROTE', st.wrote, false)}
        {row(58, 'THE CHECKER NEEDS', st.need, !st.emit && !!st.need)}
        {row(106, 'IT EMITS', st.emit, !!st.emit && !st.run)}
        {row(154, 'AT RUN TIME', st.run, !!st.run)}
        <T x={6} y={204} size={11} weight={700} fill={tok('muted')}>DICTIONARIES</T>
        {DICTS.map((d, k) => (
          <T key={k} x={14} y={224 + k * 20} size={11} mono opacity={k < st.dicts ? 1 : 0.3}>{d}</T>
        ))}
      </Svg>
    </StepFrame>
  );
}
