import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 313: how one pub field breaks a safety invariant. The
// E0603 message is what rustc 1.97.0 printed for building Ascii from
// outside its module; the UTF-8 point (a non-UTF-8 str is valid but
// unsafe) follows the Unsafe Code Guidelines glossary.
type S = { code: string; line: number; bytes: string[]; ok: 'yes' | 'no' | 'err'; who: string; note: string };

const PRIV = `mod ascii {
    pub struct Ascii(Vec<u8>);
}
let a = Ascii::new(b"hi".to_vec());
let b = ascii::Ascii(vec![0xFF]);`;
const PUB = `mod ascii {
    pub struct Ascii(pub Vec<u8>);
}
let b = ascii::Ascii(vec![0xFF]);
b.as_str().chars().count()`;

const STATES: S[] = [
  { code: PRIV, line: 1, bytes: [], ok: 'yes', who: 'inside the module: new, push, as_str', note: 'The field has no pub. Only code inside mod ascii can read or set it, so new and push are the only places an Ascii is made or changed.' },
  { code: PRIV, line: 3, bytes: ['68', '69'], ok: 'yes', who: 'built by new, which checked', note: 'Outside, the only way in is new, which checks every byte. "hi" is 0x68 0x69, both below 0x80: the invariant holds.' },
  { code: PRIV, line: 4, bytes: [], ok: 'err', who: 'rejected at compile time', note: 'Building one directly does not compile: error[E0603]: tuple struct constructor `Ascii` is private. The fence works.' },
  { code: PUB, line: 1, bytes: [], ok: 'yes', who: 'every crate that uses ascii', note: 'Now add pub to the field. Nothing in an unsafe block changes, and every test still passes.' },
  { code: PUB, line: 3, bytes: ['FF'], ok: 'no', who: 'built by safe code, unchecked', note: 'But any safe code can now build Ascii(vec![0xFF]). 0xFF is not ASCII, and no UTF-8 text contains that byte.' },
  { code: PUB, line: 4, bytes: ['FF'], ok: 'no', who: 'as_str trusted the invariant', note: 'as_str skips the check, so this safe line holds a &str that is not UTF-8, and string methods may misbehave: undefined behaviour reached without writing unsafe. The type is unsound.' },
];

export default function InvariantSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const col = st.ok === 'yes' ? 'safe' : st.ok === 'no' ? 'danger' : 'brand';
  return (
    <StepFrame title="One pub, one broken promise" steps={s} note={st.note}>
      <CodeTrace code={st.code} line={st.line} />
      <Svg w={400} h={118} title="The bytes inside an Ascii value, and whether its invariant holds">
        <T x={8} y={14} size={11} weight={700} fill={tok('muted')}>bytes inside the Ascii</T>
        {st.bytes.length === 0 && <T x={8} y={44} size={12} mono fill={tok('muted')}>(none made)</T>}
        {st.bytes.map((b, k) => (
          <Box key={k} x={8 + k * 64} y={26} w={56} h={34} r={4}
            fill={tok(b === 'FF' ? 'danger' : 'safe', 0.15)} stroke={tok(b === 'FF' ? 'danger' : 'safe')}>
            <T x={36 + k * 64} y={43} size={13} mono anchor="middle">0x{b}</T>
          </Box>
        ))}
        <Box x={8} y={74} w={384} h={36} r={4} fill={tok(col, 0.12)} stroke={tok(col)}>
          <T x={18} y={92} size={11}>{st.ok === 'yes' ? 'invariant holds' : st.ok === 'no' ? 'invariant broken' : 'does not compile'}</T>
          <T x={384} y={92} size={11} anchor="end" fill={tok('muted')}>{st.who}</T>
        </Box>
      </Svg>
    </StepFrame>
  );
}
