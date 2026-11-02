import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const CODE = `function pratt(minBp) {
  // prefix position: nothing on the left
  let left = prefix(advance());
  for (;;) {
    const bp = BP[peek()];
    if (!bp || bp <= minBp) break;
    // infix position: after an operand
    left = infix(left, advance(), bp);
  }
  return left;
}`;

const TOKS = ['-', 'a', '*', 'f', '(', '2', ')', 'end'];

type Role = 'prefix' | 'infix';
type S = {
  line: number;
  cur: number;
  roles: Record<number, Role>;
  frames: { minBp: number; left: string | null; who: string }[];
  check?: { t: string; bp: number | null; minBp: number; take: boolean };
  tree: string | null;
  note: string;
};

const STATES: S[] = [
  { line: 0, cur: 0, roles: {}, frames: [{ minBp: 0, left: null, who: 'top' }], tree: null, note: 'pratt(0) starts with nothing on its left, so whatever comes first must start an operand: the next token is in prefix position.' },
  { line: 2, cur: 1, roles: { 0: 'prefix' }, frames: [{ minBp: 0, left: null, who: 'top' }, { minBp: 7, left: null, who: 'operand of -' }], tree: null, note: 'The first token is -. In prefix position its job is negate, so the prefix rule for - runs, and it parses its own operand with pratt(7), the binding power of prefix operators.' },
  { line: 2, cur: 2, roles: { 0: 'prefix', 1: 'prefix' }, frames: [{ minBp: 0, left: null, who: 'top' }, { minBp: 7, left: 'a', who: 'operand of -' }], tree: null, note: 'Inside pratt(7) there is again nothing on the left, so a is in prefix position too: a name is a whole operand by itself.' },
  { line: 5, cur: 2, roles: { 0: 'prefix', 1: 'prefix' }, frames: [{ minBp: 0, left: null, who: 'top' }, { minBp: 7, left: 'a', who: 'operand of -' }], check: { t: '*', bp: 6, minBp: 7, take: false }, tree: null, note: 'Now pratt(7) holds an operand, so the * after it would be infix. Its binding power 6 is not above 7, so this call stops and hands back just a. The minus holds a more tightly than the * can.' },
  { line: 2, cur: 2, roles: { 0: 'prefix', 1: 'prefix' }, frames: [{ minBp: 0, left: '(- a)', who: 'top' }], tree: '(- a)', note: 'The prefix rule for - wraps what came back: (- a). That is the top call’s first operand, its left.' },
  { line: 7, cur: 3, roles: { 0: 'prefix', 1: 'prefix', 2: 'infix' }, frames: [{ minBp: 0, left: '(- a)', who: 'top' }, { minBp: 6, left: null, who: 'right of *' }], check: { t: '*', bp: 6, minBp: 0, take: true }, tree: '(- a)', note: 'The top call peeks at the same *: 6 > 0, so it takes it. Here * is in infix position (it follows the operand (- a)) and means multiply. Its right side is parsed by pratt(6).' },
  { line: 2, cur: 4, roles: { 0: 'prefix', 1: 'prefix', 2: 'infix', 3: 'prefix' }, frames: [{ minBp: 0, left: '(- a)', who: 'top' }, { minBp: 6, left: 'f', who: 'right of *' }], tree: '(- a)', note: 'pratt(6) has nothing on its left yet, so f is in prefix position: a name.' },
  { line: 7, cur: 4, roles: { 0: 'prefix', 1: 'prefix', 2: 'infix', 3: 'prefix', 4: 'infix', 5: 'prefix' }, frames: [{ minBp: 0, left: '(- a)', who: 'top' }, { minBp: 6, left: '(call f 2)', who: 'right of *' }], check: { t: '(', bp: 8, minBp: 6, take: true }, tree: '(- a)', note: 'The ( comes after the operand f, so it is in infix position: a call, not a grouping. Its power 8 beats 6, so it is taken; the call rule reads the argument 2 (an operand of its own, in prefix position) and then the ).' },
  { line: 5, cur: 7, roles: { 0: 'prefix', 1: 'prefix', 2: 'infix', 3: 'prefix', 4: 'infix', 5: 'prefix' }, frames: [{ minBp: 0, left: '(- a)', who: 'top' }, { minBp: 6, left: '(call f 2)', who: 'right of *' }], check: { t: 'end', bp: null, minBp: 6, take: false }, tree: '(- a)', note: 'The end of the input has no binding power, so pratt(6) returns the call.' },
  { line: 9, cur: 7, roles: { 0: 'prefix', 1: 'prefix', 2: 'infix', 3: 'prefix', 4: 'infix', 5: 'prefix' }, frames: [{ minBp: 0, left: '(* (- a) (call f 2))', who: 'top' }], tree: '(* (- a) (call f 2))', note: 'The top call builds the multiply node and, at the end of the input, returns it. Every token was given its job by one question: did the parser already hold an operand when it met it?' },
];

export default function PrefixInfixSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const FH = 26;
  return (
    <StepFrame title="Prefix or infix? Parsing -a * f(2)" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={236} title="Parsing minus a times f of 2: the tokens, each labelled prefix or infix once the parser has met it, the stack of pratt calls, and the tree so far.">
        {TOKS.map((t, k) => {
          const x = 8 + k * 48;
          const role = st.roles[k];
          const peek = st.check && k === st.cur;
          return (
            <g key={k} opacity={k < st.cur && !role ? 0.4 : 1}>
              <Box x={x} y={4} w={42} h={28} fill={peek ? tok('brand', 0.16) : tok('panel')} stroke={peek ? tok('brand') : tok('ink', 0.4)}>
                <T x={x + 21} y={18} size={t === 'end' ? 11 : 15} mono anchor="middle" weight={peek ? 700 : 400}>{t}</T>
              </Box>
              {role && <T x={x + 21} y={42} size={10.5} anchor="middle" weight={700} fill={role === 'prefix' ? tok('accent') : tok('brand')}>{role}</T>}
            </g>
          );
        })}

        <T x={8} y={62} size={11} weight={700} fill={tok('muted')}>CALLS OF pratt (newest at the bottom)</T>
        {st.frames.map((f, k) => {
          const y = 72 + k * (FH + 4);
          const active = k === st.frames.length - 1;
          return (
            <Box key={k} x={8 + k * 10} y={y} w={384 - k * 10} h={FH} fill={active ? tok('brand', 0.12) : 'transparent'} stroke={active ? tok('brand') : tok('ink', 0.35)}>
              <T x={16 + k * 10} y={y + FH / 2} size={12} mono weight={active ? 700 : 400}>pratt({f.minBp})</T>
              <T x={86 + k * 10} y={y + FH / 2} size={11} fill={tok('muted')}>{f.who}</T>
              <T x={384} y={y + FH / 2} size={12} mono anchor="end" fill={f.left ? tok('ink') : tok('muted')}>left = {f.left ?? '…'}</T>
            </Box>
          );
        })}

        {st.check && (
          <Box x={8} y={140} w={384} h={26} fill={st.check.take ? tok('safe', 0.12) : tok('danger', 0.1)} stroke={st.check.take ? tok('safe') : tok('danger')}>
            <T x={200} y={153} size={12.5} mono anchor="middle" weight={700}>
              {st.check.bp === null
                ? 'peek end: no bp → return'
                : st.check.take
                  ? `peek '${st.check.t}': bp ${st.check.bp} > ${st.check.minBp} → take it`
                  : `peek '${st.check.t}': bp ${st.check.bp} ≤ ${st.check.minBp} → return`}
            </T>
          </Box>
        )}

        <T x={8} y={190} size={11} weight={700} fill={tok('muted')}>THE TREE SO FAR</T>
        <T x={8} y={212} size={14} mono weight={700} fill={st.tree ? tok('brand') : tok('muted')}>{st.tree ?? 'nothing yet'}</T>
      </Svg>
    </StepFrame>
  );
}
