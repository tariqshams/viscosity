// Chapter 139: the 16 bytes of a drip-rs Value, byte by byte. The layout
// is what rustc 1.97 chose on x86-64, read from `-Zprint-type-sizes`
// (unlocked on stable with RUSTC_BOOTSTRAP=1) for a copy of the Value
// enum from book/companion/rust/src/value.rs: a 1-byte tag at offset 0;
// Bool at byte 1; Gc handles (u32) at bytes 4-7; StrRef (handle, hash)
// at bytes 4-11; f64 at bytes 8-15. Option<Value> has no discriminant
// line of its own: it is 16 bytes (size_of, rustc 1.97) and None uses a
// spare tag value. Re-checked on the current eleven-variant Value.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

type Part = { from: number; to: number; label: string; color: string };
type S = { title: string; tag: string; parts: Part[]; pad: string; note: string };

const STATES: S[] = [
  {
    title: 'Value::None', tag: 'None', parts: [], pad: 'unused: 15 bytes',
    note: 'Every Value starts with a one-byte tag. None has no payload at all, so the other 15 bytes mean nothing. They are still there: every Value is the same size, so the stack is a plain array of 16-byte slots.',
  },
  {
    title: 'Value::Bool(true)', tag: 'Bool', parts: [{ from: 1, to: 1, label: '1', color: 'f3' }], pad: 'unused: 14 bytes',
    note: 'A bool needs one byte and has alignment 1, so rustc packs it right after the tag, at byte 1, where true is stored as the value 1.',
  },
  {
    title: 'Value::Closure(Gc)', tag: 'Closure', parts: [{ from: 4, to: 7, label: 'index u32', color: 'f2' }], pad: 'padding 1–3, unused 8–15',
    note: 'A Gc handle is a u32 index into an arena, 4 bytes with alignment 4. It can’t start at byte 1, so it goes at byte 4. Bytes 1–3 are padding. The closure itself lives in the heap.',
  },
  {
    title: 'Value::String(StrRef)', tag: 'String', parts: [{ from: 4, to: 7, label: 'handle', color: 'f2' }, { from: 8, to: 11, label: 'hash', color: 'f4' }], pad: 'padding 1–3, unused 12–15',
    note: 'A StrRef is a handle and a 32-bit hash: 8 bytes, alignment 4. The hash sits in bytes that Number needs anyway, so carrying it costs nothing. The hash table never has to visit the heap to hash a key.',
  },
  {
    title: 'Value::Number(0.5)', tag: 'Number', parts: [{ from: 8, to: 15, label: 'f64  0.5', color: 'f1' }], pad: 'padding 1–7',
    note: 'The f64 is the reason for 16. It needs 8 bytes at an address that is a multiple of 8, so it can’t start before byte 8. Tag (1) + padding (7) + f64 (8) = 16, and 16 is also a multiple of the alignment, 8.',
  },
  {
    title: 'Option<Value>: None', tag: 'spare', parts: [], pad: 'still 16 bytes',
    note: 'Value has eleven variants, which use eleven of the tag’s 256 possible values. So Option<Value> adds no tag of its own: None is stored as a tag value no Value uses. rustc chose this; the Reference doesn’t promise it.',
  },
];

const X0 = 8;
const CW = 24;

export default function ValueLayoutSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const covered = new Set<number>([0]);
  for (const p of st.parts) for (let b = p.from; b <= p.to; b++) covered.add(b);
  return (
    <StepFrame title="Where a Value's 16 bytes go" steps={s} note={st.note}>
      <Svg w={400} h={150} title="Sixteen byte cells: a tag at byte 0, then the payload of the current variant">
        <T x={X0} y={14} size={13} mono weight={700}>{st.title}</T>
        {[0, 4, 8, 12].map((b) => (
          <T key={b} x={X0 + b * CW + 2} y={36} size={11} mono fill={tok('muted')}>{b}</T>
        ))}
        {Array.from({ length: 16 }, (_, b) => (
          <Box key={b} x={X0 + b * CW} y={44} w={CW - 2} h={34} r={2}
            dash={!covered.has(b)}
            fill={b === 0 ? tok('brand', 0.18) : covered.has(b) ? tok('panel') : tok('paper')}
            stroke={b === 0 ? tok('brand') : covered.has(b) ? tok('ink', 0.5) : tok('line')} />
        ))}
        {st.parts.map((p, k) => (
          <g key={k}>
            <rect x={X0 + p.from * CW} y={44} width={(p.to - p.from + 1) * CW - 2} height={34} rx={2} fill={tok('panel')} />
            <rect x={X0 + p.from * CW} y={44} width={(p.to - p.from + 1) * CW - 2} height={34} rx={2} fill={tok(p.color, 0.22)} stroke={tok(p.color)} strokeWidth={1.5} />
            <T x={X0 + ((p.from + p.to + 1) / 2) * CW - 1} y={61} size={11} mono anchor="middle" fill={tok('ink')}>{p.label}</T>
          </g>
        ))}
        <T x={X0 + 11} y={92} size={11} mono anchor="middle" fill={tok('brand')} weight={700}>tag</T>
        <T x={X0} y={112} size={11} fill={tok('brand')} weight={700}>tag: {st.tag}</T>
        <T x={X0 + 120} y={112} size={11} fill={tok('muted')}>{st.pad}</T>
        <T x={X0} y={136} size={11} mono fill={tok('muted')}>{'size_of::<Value>() = 16, align 8'}</T>
      </Svg>
    </StepFrame>
  );
}
