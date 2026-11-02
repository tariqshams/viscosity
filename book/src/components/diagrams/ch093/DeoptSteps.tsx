// Chapter 93: speculate, guard, bail out. The feedback values and the trace
// messages quoted in the notes are real output from Node v22.23.4 (V8 12.4):
// %DebugPrint of the feedback vector, then --trace-opt --trace-deopt for the
// same program. The "optimized code" box is a sketch, not V8's machine code.
import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const CODE = `function add(a, b) {
  return a + b;
}
for (let i = 0; i < 1e5; i++)
  add(i, 1);
add('a', 'b');`;

type Tier = 'ignition' | 'turbofan';
type S = {
  line: number | null;
  tier: Tier;
  fb: string;
  code: 'none' | 'smi' | 'generic';
  guard?: 'pass' | 'fail';
  deopts: number;
  arrow?: 'up' | 'down';
  note: string;
};

const STATES: S[] = [
  { line: 4, tier: 'ignition', fb: 'none yet', code: 'none', deopts: 0, note: 'Every function starts in Ignition, the interpreter. Its bytecode for a + b is one generic Add, which must work for numbers, strings, objects, anything.' },
  { line: 1, tier: 'ignition', fb: 'SignedSmall', code: 'none', deopts: 0, note: 'While it runs, Ignition records what each operation sees. After a few calls with integers, the feedback slot for + says BinaryOp:SignedSmall: only small integers so far.' },
  { line: 4, tier: 'turbofan', fb: 'SignedSmall', code: 'smi', guard: 'pass', deopts: 0, arrow: 'up', note: 'add is hot ("hot and stable", says --trace-opt), so TurboFan compiles it, trusting the feedback. The new code checks its guess, then does a plain integer add.' },
  { line: 5, tier: 'turbofan', fb: 'SignedSmall', code: 'smi', guard: 'fail', deopts: 0, note: "add('a', 'b'). The first guard fails: 'a' is not a Smi. The optimized code has no idea how to join strings, and it doesn't need one. It has a way out." },
  { line: 1, tier: 'ignition', fb: 'Any', code: 'none', deopts: 1, arrow: 'down', note: 'Deoptimization: "bailout (kind: deopt-eager, reason: not a Smi)". The deoptimizer rebuilds the interpreter frame for add at the same point, and Ignition finishes the +. The answer is \'ab\', exactly as if nothing had been optimized.' },
  { line: null, tier: 'turbofan', fb: 'Any', code: 'generic', deopts: 1, arrow: 'up', note: 'The feedback has widened (it reads Any after a string call), and the old optimized code is thrown away. If add gets hot again, V8 recompiles it from the wider feedback, so it doesn’t make the same guess again. (In a longer run that keeps calling add, --trace-opt shows it compiled a second time.)' },
];

export default function DeoptSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const on = (t: Tier) => st.tier === t;
  const guardCol = st.guard === 'fail' ? 'danger' : st.guard === 'pass' ? 'safe' : 'muted';
  return (
    <StepFrame title="Speculate, guard, bail out" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={268} title="Two tiers, Ignition and TurboFan, with the feedback slot for + and the optimized code's guard between them">
        <Box x={4} y={8} w={180} h={70} fill={on('ignition') ? tok('brand', 0.14) : tok('panel')} stroke={on('ignition') ? tok('brand') : tok('line')}>
          <T x={14} y={26} size={12} weight={700}>Ignition</T>
          <T x={14} y={46} size={11} fill={tok('muted')}>bytecode, generic Add</T>
          <T x={14} y={64} size={11} fill={tok('muted')}>records feedback</T>
        </Box>
        <Box x={216} y={8} w={180} h={70} fill={on('turbofan') ? tok('brand', 0.14) : tok('panel')} stroke={on('turbofan') ? tok('brand') : tok('line')}>
          <T x={226} y={26} size={12} weight={700}>TurboFan</T>
          <T x={226} y={46} size={11} fill={tok('muted')}>optimized machine code</T>
          <T x={226} y={64} size={11} fill={tok('muted')}>{st.code === 'none' ? 'none for add' : st.code === 'smi' ? 'speculates: integers' : 'compiled for Any'}</T>
        </Box>
        {st.arrow === 'up' && <Arrow x1={186} y1={34} x2={213} y2={34} color={tok('brand')} />}
        {st.arrow === 'down' && <Arrow x1={214} y1={58} x2={187} y2={58} color={tok('danger')} />}
        <T x={4} y={100} size={11} weight={700} fill={tok('muted')}>FEEDBACK FOR +</T>
        <Box x={4} y={110} w={180} h={30} fill={tok('panel')}>
          <T x={14} y={125} size={12} mono>{st.fb === 'none yet' ? 'none yet' : `BinaryOp:${st.fb}`}</T>
        </Box>
        <T x={216} y={100} size={11} weight={700} fill={tok('muted')}>DEOPTS</T>
        <Box x={216} y={110} w={180} h={30} fill={st.deopts ? tok('danger', 0.1) : tok('panel')} stroke={st.deopts ? tok('danger') : tok('line')}>
          <T x={226} y={125} size={12} mono>{st.deopts}</T>
        </Box>
        <T x={4} y={162} size={11} weight={700} fill={tok('muted')}>OPTIMIZED add (A SKETCH)</T>
        <Box x={4} y={172} w={392} h={88} fill={st.code === 'none' ? 'transparent' : tok('panel')} dash={st.code === 'none'} opacity={st.code === 'none' ? 0.5 : 1}>
          {st.code === 'generic' ? (
            <>
              <T x={14} y={192} size={12} mono>no Smi guess on a and b</T>
              <T x={14} y={212} size={12} mono>numbers, strings: handled</T>
              <T x={14} y={232} size={12} mono>(slower, but no deopt here)</T>
            </>
          ) : (
            <>
              <T x={14} y={192} size={12} mono fill={st.code === 'smi' ? tok(guardCol) : undefined} weight={st.guard === 'fail' ? 700 : 400}>check a, b are Smis, else deopt</T>
              <T x={14} y={212} size={12} mono>r = a + b (integer add)</T>
              <T x={14} y={232} size={12} mono>check no overflow, else deopt</T>
              <T x={14} y={250} size={12} mono>return r</T>
            </>
          )}
        </Box>
      </Svg>
    </StepFrame>
  );
}
