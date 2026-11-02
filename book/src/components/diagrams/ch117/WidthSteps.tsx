// int[2][3]: the base type goes down the chain of C nodes (inherited),
// then the array type and its width come back up (synthesized).
import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';
import { type N, drawTree, layout } from './atree';

const leaf = (id: string, label: string): N => ({ id, label, term: true });
const TREE: N = {
  id: 'T', label: 'T', kids: [
    { id: 'B', label: 'B', kids: [leaf('int', 'int')] },
    { id: 'C', label: 'C', kids: [
      leaf('l1', '['), leaf('n2', '2'), leaf('r1', ']'),
      { id: 'C1', label: 'C₁', kids: [
        leaf('l2', '['), leaf('n3', '3'), leaf('r2', ']'),
        { id: 'C2', label: 'C₂', kids: [leaf('eps', 'ε')] },
      ] },
    ] },
  ],
};
const P = layout(TREE, 4, 396, 14, 27);
const ROWS = ['B', 'C', 'C1', 'C2', 'T'];
const NAME: Record<string, string> = { B: 'B', C: 'C', C1: 'C₁', C2: 'C₂', T: 'T' };
type Row = { b?: string; t?: string; w?: string };
type S = { hi?: string; rows: Record<string, Row>; dir?: 'down' | 'up'; note: string };
const STATES: S[] = [];
const push = (hi: string | undefined, dir: S['dir'], change: Record<string, Row>, note: string) => {
  const prev = STATES.length ? STATES[STATES.length - 1].rows : {};
  const rows: Record<string, Row> = { ...prev };
  for (const [k, v] of Object.entries(change)) rows[k] = { ...prev[k], ...v };
  STATES.push({ hi, dir, rows, note });
};
push(undefined, undefined, {}, 'The tree for int[2][3]. B is the base type, and each C adds one pair of brackets. No attribute is known yet.');
push('B', 'up', { B: { t: 'int', w: '4' } }, 'B → int: B.t = int and B.w = 4 (an int takes 4 bytes here). Both are synthesized: they come from B’s own child.');
push('C', 'down', { C: { b: 'int, 4' } }, 'T → B C hands B’s results across to its other child: C.b = B.t and C.bw = B.w. For C these are inherited: they come from its parent’s rule, not from C’s own children.');
push('C1', 'down', { C1: { b: 'int, 4' } }, 'C → [ 2 ] C₁ passes the base type straight down: C₁.b = C.b, C₁.bw = C.bw.');
push('C2', 'down', { C2: { b: 'int, 4' } }, 'And again: C₂ inherits int and 4. The information has reached the bottom of the chain.');
push('C2', 'up', { C2: { t: 'int', w: '4' } }, 'C → ε has no brackets left, so its type is the base type: C₂.t = C₂.b = int, C₂.w = 4. Now the values turn round and flow up.');
push('C1', 'up', { C1: { t: 'array(3, int)', w: '12' } }, 'C₁ → [ 3 ] C₂: C₁.t = array(3, C₂.t) = array(3, int), and C₁.w = 3 × 4 = 12.');
push('C', 'up', { C: { t: 'array(2, array(3, int))', w: '24' } }, 'C → [ 2 ] C₁: an array of 2 of those, so C.t = array(2, array(3, int)) and C.w = 2 × 12 = 24.');
push('T', 'up', { T: { t: 'array(2, array(3, int))', w: '24' } }, 'T copies C’s results: int[2][3] is an array of 2 arrays of 3 ints, 24 bytes. Down first (inherited), then up (synthesized).');

export default function WidthSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="The type and width of int[2][3]" steps={s} note={st.note}>
      <Svg w={400} h={268} title="The parse tree of int[2][3] above a table of the attributes b (inherited base type and width), t (type) and w (width) for the nodes B, C, C₁, C₂ and T">
        {drawTree(P, st.dir && st.hi ? { [st.hi]: st.dir === 'down' ? '↓' : '↑' } : {}, st.hi)}
        <Box x={4} y={132} w={392} h={130}>
          <T x={12} y={146} size={11} weight={700} fill={tok('muted')}>node</T>
          <T x={52} y={146} size={11} weight={700} fill={tok('accent')}>b, bw (down)</T>
          <T x={140} y={146} size={11} weight={700} fill={tok('safe')}>t (up)</T>
          <T x={388} y={146} size={11} weight={700} fill={tok('safe')} anchor="end">w (up)</T>
          {ROWS.map((r, k) => {
            const row = st.rows[r] ?? {};
            const y = 168 + k * 21;
            return (
              <g key={r}>
                {st.hi === r && <rect x={8} y={y - 10} width={384} height={20} rx={3} fill={tok('brand', 0.15)} />}
                <T x={12} y={y} size={12} mono weight={700}>{NAME[r]}</T>
                <T x={52} y={y} size={12} mono fill={tok('accent')}>{row.b ?? ''}</T>
                <T x={140} y={y} size={12} mono fill={tok('safe')}>{row.t ?? ''}</T>
                <T x={388} y={y} size={12} mono anchor="end" fill={tok('safe')}>{row.w ?? ''}</T>
              </g>
            );
          })}
        </Box>
      </Svg>
    </StepFrame>
  );
}
