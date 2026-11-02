import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// Three bytes fall through a scanner's match, top to bottom. Range
// patterns test "between", an or-pattern tries each alternative, and the
// wildcard at the end catches whatever is left.

const CODE = `match c {
    b'0'..=b'9' => "digit",
    b'a'..=b'z' | b'A'..=b'Z'
        | b'_' => "letter",
    b' ' | b'\\n' => "space",
    _ => "other",
}`;

type Alt = { pat: string; ok: boolean | null };
type S = { line: number | null; ch: string; code: number; alts: Alt[]; result?: string; note: string };

const STATES: S[] = [
  { line: null, ch: '7', code: 55, alts: [], note: "c is the byte b'7'. Bytes are numbers: the character 7 is byte 55, and the digits 0 to 9 are the bytes 48 to 57, in order." },
  { line: 1, ch: '7', code: 55, alts: [{ pat: "48..=57", ok: true }], result: 'digit', note: "Arm 1 is a range pattern: does 55 lie between 48 and 57, both ends included? Yes, so the match is \"digit\", and no later arm is tried." },
  { line: 1, ch: '_', code: 95, alts: [{ pat: "48..=57", ok: false }], note: "Now c = b'_', byte 95. It is not a digit, so arm 1 fails and the next arm is tried." },
  { line: 2, ch: '_', code: 95, alts: [{ pat: "97..=122", ok: false }, { pat: "65..=90", ok: false }, { pat: "95", ok: true }], result: 'letter', note: "Arm 2 is an or-pattern with three alternatives: a to z (97 to 122), A to Z (65 to 90) and the single byte _. The third fits, so the whole arm fits: \"letter\"." },
  { line: 4, ch: '+', code: 43, alts: [{ pat: "32", ok: false }, { pat: "10", ok: false }], note: "c = b'+', byte 43. Arms 1 and 2 fail as before, and neither alternative of arm 3 (space is 32, newline is 10) fits either." },
  { line: 5, ch: '+', code: 43, alts: [{ pat: '_', ok: true }], result: 'other', note: "The wildcard _ fits anything, so it catches whatever the arms above it let through: \"other\". It must come last; an arm after it could never be reached." },
];

export default function ByteSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="A byte falling through a scanner's match" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={110} title="The byte being matched and the alternatives of the arm being tried, each marked as fitting or not">
        <T x={8} y={14} size={11} weight={700} fill={tok('muted')}>THE BYTE c</T>
        <Box x={8} y={26} w={90} h={40} r={4} fill={tok('accent', 0.15)} stroke={tok('accent')}>
          <T x={53} y={39} size={13} mono weight={700} anchor="middle">b'{st.ch}'</T>
          <T x={53} y={56} size={11} mono anchor="middle" fill={tok('muted')}>= {st.code}</T>
        </Box>
        <T x={120} y={14} size={11} weight={700} fill={tok('muted')}>ALTERNATIVES TRIED</T>
        {st.alts.map((a, i) => (
          <Box key={i} x={120 + i * 92} y={26} w={86} h={40} r={4} fill={tok(a.ok ? 'safe' : 'danger', 0.12)} stroke={tok(a.ok ? 'safe' : 'danger')}>
            <T x={163 + i * 92} y={39} size={11} mono anchor="middle">{a.pat}</T>
            <T x={163 + i * 92} y={56} size={13} weight={700} anchor="middle" fill={tok(a.ok ? 'safe' : 'danger')}>{a.ok ? '✓ fits' : '✗'}</T>
          </Box>
        ))}
        {st.result && <T x={8} y={92} size={13} mono weight={700}>result: "{st.result}"</T>}
      </Svg>
    </StepFrame>
  );
}
