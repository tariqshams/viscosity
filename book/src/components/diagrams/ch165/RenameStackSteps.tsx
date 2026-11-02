// Chapter 165: renaming n in the Collatz loop, Cytron et al.'s way: a
// walk down the dominator tree with a stack of versions. An assignment
// (or phi) pushes a new version; a use reads the top; on the way out of a
// block, its versions are popped. Phi operands are filled in from the
// predecessor's side, with the version on top when the walk is there.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const POS: Record<number, [number, number]> = {
  0: [150, 24], 1: [150, 82], 2: [100, 140], 4: [230, 140],
  5: [40, 206], 6: [110, 206], 7: [180, 206], 3: [180, 266],
};
const TREE: [number, number][] = [[1, 0], [4, 1], [2, 1], [6, 2], [5, 2], [7, 2], [3, 7]];

type St = { at: number | null; stack: string[]; b1: string; b7: string; note: string };

const STATES: St[] = [
  { at: null, stack: ['n0'], b1: 'n? = φ(?, ?)', b7: 'n? = φ(?, ?)', note: 'The phis are placed; now every n gets its version. The stack starts with n0, the value n has on entry (the parameter). The walk follows the dominator tree, not the CFG.' },
  { at: 0, stack: ['n0'], b1: 'n? = φ(n0, ?)', b7: 'n? = φ(?, ?)', note: 'b0 assigns nothing new. Its successor b1 has a phi, and b0 is b1’s first predecessor, so the first operand is the top of the stack: n0.' },
  { at: 1, stack: ['n0', 'n1'], b1: 'n1 = φ(n0, ?)', b7: 'n? = φ(?, ?)', note: 'Enter b1. Its phi is an assignment, so it gets a new version, n1, pushed on the stack. The test n > 1 reads the top: n1 > 1.' },
  { at: 2, stack: ['n0', 'n1'], b1: 'n1 = φ(n0, ?)', b7: 'n? = φ(?, ?)', note: 'b2 (a child of b1 in the tree) only reads n: n1 % 2. No push.' },
  { at: 5, stack: ['n0', 'n1', 'n2'], b1: 'n1 = φ(n0, ?)', b7: 'n? = φ(n2, ?)', note: 'b5 reads n1 and assigns n2 = 3 * n1 + 1. Its successor b7 has a phi, and b5 is b7’s first predecessor: operand 1 is n2.' },
  { at: 6, stack: ['n0', 'n1', 'n3'], b1: 'n1 = φ(n0, ?)', b7: 'n? = φ(n2, n3)', note: 'Leaving b5 popped n2. b6 reads n1 (not n2: the branches never see each other’s versions) and assigns n3 = n1 / 2, which fills b7’s second operand.' },
  { at: 7, stack: ['n0', 'n1', 'n4'], b1: 'n1 = φ(n0, ?)', b7: 'n4 = φ(n2, n3)', note: 'Leaving b6 popped n3. Enter b7: its phi gets version n4, pushed.' },
  { at: 3, stack: ['n0', 'n1', 'n4'], b1: 'n1 = φ(n0, n4)', b7: 'n4 = φ(n2, n3)', note: 'b3 assigns nothing. Its successor b1 has a phi, and b3 is b1’s second predecessor, so the second operand is the top: n4. The back edge carries the newest n.' },
  { at: 4, stack: ['n0', 'n1'], b1: 'n1 = φ(n0, n4)', b7: 'n4 = φ(n2, n3)', note: 'Back up the tree, popping n4. b4, the other child of b1, returns n: the top is n1. Then b1’s n1 is popped, and the walk ends. Compare VIR: %1 = phi %0, %12 and %12 = phi %9, %11.' },
];

export default function RenameStackSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Renaming with a stack, down the dominator tree" steps={s} note={st.note}>
      <Svg w={400} h={330} title="The dominator tree of the Collatz loop, walked from the root, with a stack of versions of n and the two phis being filled in.">
        {TREE.map(([b, d]) => {
          const [x1, y1] = POS[d], [x2, y2] = POS[b];
          return <Arrow key={b} x1={x1} y1={y1 + 13} x2={x2} y2={y2 - 13} color={tok('accent')} />;
        })}
        {Object.entries(POS).map(([k, [x, y]]) => {
          const on = st.at === Number(k);
          return (
            <Box key={k} x={x - 22} y={y - 13} w={44} h={26} r={13}
              fill={on ? tok('brand', 0.25) : tok('panel')} stroke={on ? tok('brand') : tok('line')}>
              <T x={x} y={y} size={12} weight={700} anchor="middle">{`b${k}`}</T>
            </Box>
          );
        })}
        <T x={318} y={14} size={11} weight={700} fill={tok('muted')}>stack of n</T>
        {st.stack.map((v, k) => (
          <Box key={k} x={322} y={190 - k * 30} w={60} h={26}
            fill={k === st.stack.length - 1 ? tok('brand', 0.18) : tok('panel')}
            stroke={k === st.stack.length - 1 ? tok('brand') : tok('line')}>
            <T x={352} y={203 - k * 30} size={13} mono anchor="middle">{v}</T>
          </Box>
        ))}
        <T x={322} y={232} size={11} fill={tok('muted')}>top is the</T>
        <T x={322} y={248} size={11} fill={tok('muted')}>highest box</T>
        <T x={8} y={300} size={12} mono>{`b1: ${st.b1}`}</T>
        <T x={8} y={320} size={12} mono>{`b7: ${st.b7}`}</T>
      </Svg>
    </StepFrame>
  );
}
