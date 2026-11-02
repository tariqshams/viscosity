import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 336: the five test layers of engine/rust (parity.rs, the node and
// python3 halves of differential.rs, the wasm build against the fixtures,
// scripts/fuzz.mjs) and, for each kind of bug, which of them could notice
// it given its oracle, inputs and options. Rows 1-4 and 6 are real cases
// from Part XIII; rows 5 and 7 are hypothetical and say so. Rows 3 and 4
// show the layers as they were when the bugs were found (both now fixed).
type L = 'parity' | 'node' | 'py' | 'wasm' | 'fuzz';
type V = 'yes' | 'no' | 'maybe';
type S = { title: string; v: Record<L, V>; note: string };

const LAYERS: { k: L; label: string; oracle: string }[] = [
  { k: 'parity', label: 'parity', oracle: 'TS fixtures' },
  { k: 'node', label: 'node diff', oracle: 'original' },
  { k: 'py', label: 'python3', oracle: 'original' },
  { k: 'wasm', label: 'wasm', oracle: 'TS fixtures' },
  { k: 'fuzz', label: 'fuzzer', oracle: 'TS + original' },
];

const none: Record<L, V> = { parity: 'no', node: 'no', py: 'no', wasm: 'no', fuzz: 'no' };

const STATES: S[] = [
  { title: 'Rust-only change, corpus program', v: { ...none, parity: 'yes', node: 'yes', wasm: 'yes', fuzz: 'maybe' }, note: 'Chapter 323 deleted one line of the Rust builder. Parity failed on throw_from_loop (the TS fixture disagrees), and so did the node differential (the program throws a number). The wasm build of that code would fail the same fixtures. The fuzzer only if it generates such a program.' },
  { title: 'A miscompile in both engines', v: { ...none, fuzz: 'yes' }, note: 'Fuzz find 11: a checked write ran its bounds check before its right-hand side, in both engines. Every fixture agreed (both were wrong), and no corpus program had the pattern yet. The fuzzer’s behaviour oracle, the original program under node, found it.' },
  { title: 'Rust wording, only with --profile', v: { ...none }, note: '“about 20 (measured) elements”. Every layer that compares text could see it, but none of them passed a profile: no fixture variant, no fuzzer option, and the wasm API has no parameter for one. Since the fix, four profile fixtures and the fuzzer’s random profiles would catch it.' },
  { title: 'A profile saying "maxLength": "20"', v: { ...none }, note: 'Chapter 334: Rust skips the string and transforms; TypeScript compares "20" < 64 and keeps the array. Different decisions, but no layer passed a profile, and viscosity profile only ever writes numbers. Now both CLIs refuse the entry with the same error, and profile_cli.rs checks odd files in both.' },
  { title: 'Python divergence outside the corpus', v: { ...none }, note: 'Hypothetical. The python3 differential and the Python fixtures cover 27 programs. The fuzzer generates JavaScript only, so a Python difference on any other program has no layer at all.' },
  { title: 'Carets early after an emoji', v: { ...none }, note: 'Chapter 333: both engines count code points, so the frames agree byte for byte, and nothing runs differently. Parity is blind to shared mistakes, and behaviour tests are blind to text.' },
  { title: 'Differs only in the wasm build', v: { ...none, wasm: 'yes' }, note: 'Hypothetical: something that depends on the target (wasm32 has 32-bit pointers, for one). Only the layer that runs the wasm build against the fixtures can see it. My run of the committed build: 190 of 190.' },
];

export default function OracleSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const colour = (v: V) => (v === 'yes' ? tok('safe') : v === 'maybe' ? tok('warn') : tok('line'));
  return (
    <StepFrame title="Which layer can see this bug?" steps={s} note={st.note}>
      <Svg w={400} h={200} title="Five test layers; for each kind of bug, the layers that could notice it">
        <T x={200} y={18} size={13} weight={600} anchor="middle">{st.title}</T>
        {LAYERS.map((l, k) => {
          const v = st.v[l.k];
          const x = 8 + k * 78;
          return (
            <g key={l.k}>
              <Box x={x} y={44} w={72} h={70} r={5}
                fill={v === 'yes' ? tok('safe', 0.18) : v === 'maybe' ? tok('warn', 0.15) : tok('panel')}
                stroke={colour(v)}>
                <T x={x + 36} y={62} size={11} weight={600} anchor="middle">{l.label}</T>
                <T x={x + 36} y={92} size={20} anchor="middle" fill={v === 'no' ? tok('muted') : colour(v)}>
                  {v === 'yes' ? '✓' : v === 'maybe' ? '?' : '–'}
                </T>
              </Box>
              <T x={x + 36} y={130} size={10} anchor="middle" fill={tok('muted')}>{l.oracle}</T>
            </g>
          );
        })}
        <T x={8} y={160} size={11} fill={tok('muted')}>✓ its oracle and inputs can catch it</T>
        <T x={8} y={178} size={11} fill={tok('muted')}>? only if it happens to generate it · – blind</T>
      </Svg>
    </StepFrame>
  );
}
