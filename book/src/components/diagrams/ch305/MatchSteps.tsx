import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// A value falls through the arms of a match, top to bottom. Each arm's
// pattern is compared with the value: first the variant (the tag), then
// any payload inside it. The first arm that fits wins, and its names are
// bound to the payload. The last step drops an arm, and the compiler
// refuses the match as non-exhaustive.

const FULL = `let n = match v {
    Value::None => 0.0,
    Value::Bool(true) => 1.0,
    Value::Bool(false) => 0.0,
    Value::Number(x) => x,
};`;

const MISSING = `let n = match v {
    Value::None => 0.0,
    Value::Bool(true) => 1.0,
    Value::Number(x) => x,
};`;

type V = { tag: 'None' | 'Bool' | 'Number'; payload?: string };
type Pat = { tag: V['tag']; payload?: string; bind?: string };
const ARMS: Pat[] = [
  { tag: 'None' }, { tag: 'Bool', payload: 'true' }, { tag: 'Bool', payload: 'false' }, { tag: 'Number', bind: 'x' },
];

type S = {
  code: string; v: V | null; arm: number | null; tagOk?: boolean; payOk?: boolean;
  result?: string; error?: boolean; note: string;
};

const NUM: V = { tag: 'Number', payload: '2.5' };
const FALSE: V = { tag: 'Bool', payload: 'false' };

const STATES: S[] = [
  { code: FULL, v: NUM, arm: null, note: 'v holds Value::Number(2.5): the variant Number, carrying the payload 2.5. The match will try its arms from the top.' },
  { code: FULL, v: NUM, arm: 0, tagOk: false, note: 'Arm 1: is v the None variant? No. The variants differ, so this arm is skipped without looking any further.' },
  { code: FULL, v: NUM, arm: 1, tagOk: false, note: 'Arm 2 wants Bool(true). v isn’t a Bool at all. Skip.' },
  { code: FULL, v: NUM, arm: 2, tagOk: false, note: 'Arm 3 wants Bool(false). Still the wrong variant. Skip.' },
  { code: FULL, v: NUM, arm: 3, tagOk: true, payOk: true, result: 'x = 2.5, so n = 2.5', note: 'Arm 4: Number(x). The variant fits, and x is a name, which fits any payload. x is bound to 2.5 and the arm’s value, x, becomes the value of the whole match.' },
  { code: FULL, v: FALSE, arm: 1, tagOk: true, payOk: false, note: 'Now v = Value::Bool(false). Arm 1 failed as before. Arm 2: the variant fits, but the pattern’s payload is the literal true, and v carries false. Skip.' },
  { code: FULL, v: FALSE, arm: 2, tagOk: true, payOk: true, result: 'n = 0.0', note: 'Arm 3: Bool(false). Variant and payload both fit. First match wins, so arm 4 is never even tried.' },
  { code: MISSING, v: null, arm: null, error: true, note: 'Delete the Bool(false) arm and the compiler refuses: non-exhaustive patterns, Value::Bool(false) not covered (E0004). It checks every possible value, not just the ones your tests happen to use.' },
];

function ValueBox({ x, y, v }: { x: number; y: number; v: V }) {
  return (
    <g>
      <Box x={x} y={y} w={74} h={34} r={4} fill={tok('accent', 0.15)} stroke={tok('accent')}>
        <T x={x + 37} y={y + 17} size={13} mono weight={700} anchor="middle">{v.tag}</T>
      </Box>
      <Box x={x + 76} y={y} w={60} h={34} r={4} stroke={tok('ink', 0.5)}>
        <T x={x + 106} y={y + 17} size={13} mono anchor="middle" fill={v.payload ? tok('ink') : tok('muted')}>{v.payload ?? '—'}</T>
      </Box>
    </g>
  );
}

export default function MatchSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const pat = st.arm === null ? null : ARMS[st.arm];
  const mark = (ok?: boolean) => (ok === undefined ? null : ok ? '✓' : '✗');
  const mc = (ok?: boolean) => (ok ? tok('safe') : tok('danger'));
  // The code line of the arm being tried (the full listing has arms on lines 1–4).
  const line = st.arm === null ? (st.error ? 0 : null) : st.arm + 1;
  return (
    <StepFrame title="A value falling through match arms" steps={s} note={st.note}>
      <CodeTrace code={st.code} line={line} />
      <Svg w={400} h={150} title="The value being matched, drawn as a variant and a payload, compared with the pattern of the arm being tried">
        <T x={10} y={12} size={11} weight={700} fill={tok('muted')}>VALUE v</T>
        <T x={220} y={12} size={11} weight={700} fill={tok('muted')}>PATTERN</T>
        {st.v && <ValueBox x={10} y={26} v={st.v} />}
        {pat && (
          <g>
            <Box x={220} y={26} w={74} h={34} r={4} fill={tok('brand', 0.1)} stroke={tok('brand')}>
              <T x={257} y={43} size={13} mono weight={700} anchor="middle">{pat.tag}</T>
            </Box>
            {pat.tag !== 'None' && (
              <Box x={296} y={26} w={60} h={34} r={4} stroke={tok('brand')} dash={!!pat.bind}>
                <T x={326} y={43} size={13} mono anchor="middle">{pat.payload ?? pat.bind}</T>
              </Box>
            )}
            <T x={160} y={43} size={18} weight={700} anchor="middle" fill={mc(st.tagOk)}>{mark(st.tagOk)}</T>
            {st.tagOk && pat.tag !== 'None' && (
              <T x={370} y={43} size={18} weight={700} anchor="middle" fill={mc(st.payOk)}>{mark(st.payOk)}</T>
            )}
            <T x={10} y={82} size={12} fill={tok('muted')}>
              {st.tagOk === false ? 'variant differs: skip this arm' : st.payOk === false ? 'variant fits, payload differs: skip' : pat.bind ? 'a name fits any payload, and binds it' : 'variant and payload fit'}
            </T>
          </g>
        )}
        {st.result && (
          <Box x={10} y={98} w={250} h={34} r={6} fill={tok('safe', 0.12)} stroke={tok('safe')}>
            <T x={22} y={115} size={14} mono weight={700}>{st.result}</T>
          </Box>
        )}
        {st.error && (
          <Box x={10} y={36} w={380} h={60} r={6} fill={tok('danger', 0.12)} stroke={tok('danger')}>
            <T x={200} y={56} size={13} weight={700} anchor="middle" fill={tok('danger')}>error[E0004]: non-exhaustive patterns</T>
            <T x={200} y={78} size={13} mono anchor="middle" fill={tok('danger')}>`Value::Bool(false)` not covered</T>
          </Box>
        )}
      </Svg>
    </StepFrame>
  );
}
