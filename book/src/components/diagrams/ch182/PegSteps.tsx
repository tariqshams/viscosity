// A PEG parser with memoisation (packrat) on "aay": the first
// alternative of S fails after A has matched, the parser backtracks, and
// the second alternative finds A's result in the memo table.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const INPUT = ['a', 'a', 'y'];
const RULES = ['S ← A "x" / A "y"', 'A ← "a" "a"*'];
type Memo = [string, string];
type S = { pos: number; span?: [number, number]; bad?: boolean; rule: number; part: string; memo: Memo[]; hit?: number; note: string };
const STATES: S[] = [
  { pos: 0, rule: 0, part: 'A "x"', memo: [], note: 'Parse S at position 0. A PEG choice is ordered: try the first alternative, A "x", and only if it fails, try A "y".' },
  { pos: 0, span: [0, 2], rule: 1, part: '"a" "a"*', memo: [['A at 0', 'ends at 2']], note: 'A at position 0: one a, then as many more as there are (the * is greedy). It ends at position 2. Write that down: A at 0 ends at 2.' },
  { pos: 2, span: [2, 3], bad: true, rule: 0, part: '"x"', memo: [['A at 0', 'ends at 2']], note: 'Now "x" at position 2. The input has y there, so the first alternative fails, and the parser goes back to position 0 to try the second one.' },
  { pos: 0, span: [0, 2], rule: 0, part: 'A "y"', memo: [['A at 0', 'ends at 2']], hit: 0, note: 'The second alternative starts with A at 0 again. Without the table, A would be parsed a second time; with it, the answer (ends at 2) is looked up. That is packrat parsing.' },
  { pos: 2, span: [0, 3], rule: 0, part: '"y"', memo: [['A at 0', 'ends at 2'], ['S at 0', 'ends at 3']], note: '"y" matches at position 2, so S succeeds, from 0 to 3. Each rule is worked out at most once per position, however much the parser backtracks.' },
];

export default function PegSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Ordered choice, with a memo table" steps={s} note={st.note}>
      <Svg w={400} h={196} title="The grammar with the part being tried lit, the input with the span being matched, and the memo table">
        {RULES.map((r, k) => (
          <g key={k}>
            <rect x={4} y={6 + k * 24} width={250} height={20} rx={3} fill={k === st.rule ? tok('brand', 0.12) : 'none'} />
            <T x={12} y={16 + k * 24} size={13} mono>{r}</T>
          </g>
        ))}
        <T x={262} y={16} size={11} fill={tok('muted')}>trying:</T>
        <T x={262} y={36} size={13} mono weight={700} fill={tok('accent')}>{st.part}</T>
        {INPUT.map((c, k) => {
          const inSpan = st.span && k >= st.span[0] && k < st.span[1];
          return (
            <g key={k}>
              <Box x={40 + k * 40} y={70} w={34} h={30} fill={inSpan ? (st.bad ? tok('danger', 0.15) : tok('safe', 0.15)) : tok('panel')} stroke={inSpan ? (st.bad ? tok('danger') : tok('safe')) : tok('ink', 0.35)}>
                <T x={57 + k * 40} y={86} size={14} mono anchor="middle">{c}</T>
              </Box>
              <T x={40 + k * 40} y={110} size={10} mono anchor="middle" fill={tok('muted')}>{k}</T>
            </g>
          );
        })}
        <T x={160} y={110} size={10} mono anchor="middle" fill={tok('muted')}>3</T>
        <path d={`M${40 + st.pos * 40},64 l-5,-8 l10,0 z`} fill={tok('brand')} />
        <Box x={210} y={64} w={186} h={124}>
          <T x={218} y={78} size={11} weight={700} fill={tok('muted')}>memo table</T>
          {st.memo.map(([k, v], i) => (
            <g key={i}>
              {st.hit === i && <rect x={214} y={88 + i * 22} width={178} height={20} rx={3} fill={tok('accent', 0.2)} />}
              <T x={220} y={98 + i * 22} size={12} mono>{k}</T>
              <T x={386} y={98 + i * 22} size={12} mono anchor="end" weight={st.hit === i ? 700 : 400}>{v}</T>
            </g>
          ))}
          {st.hit !== undefined && <T x={220} y={176} size={11} weight={700} fill={tok('accent')}>found in the table: no work</T>}
        </Box>
      </Svg>
    </StepFrame>
  );
}
