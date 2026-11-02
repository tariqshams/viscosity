// Chapter 150: one string measured in two units. "é😀x": é is U+00E9
// (2 bytes in UTF-8, 1 UTF-16 code unit), 😀 is U+1F600 (4 bytes, 2 code
// units: a surrogate pair), x is ASCII (1 and 1). So x starts at byte 6
// (oxc's spans, Rust's str indices) and at code unit 3 (acorn's offsets,
// JavaScript's string indices); both name the same character.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const CHARS = [
  { c: 'é', bytes: 2, units: 1 },
  { c: '😀', bytes: 4, units: 2 },
  { c: 'x', bytes: 1, units: 1 },
];

export default function TwoRulers() {
  const bw = 42; // width of one byte
  const x0 = 26;
  let b = 0;
  let u = 0;
  const cells = CHARS.map((ch) => {
    const cell = { ...ch, b, u, x: x0 + b * bw, w: ch.bytes * bw };
    b += ch.bytes;
    u += ch.units;
    return cell;
  });
  return (
    <Svg w={400} h={230} title="The string é, smiling face, x, measured in UTF-8 bytes and in UTF-16 code units: x is at byte 6 and at code unit 3">
      <T x={x0} y={14} size={11} weight={700} fill={tok('brand')}>UTF-8 bytes (oxc, Rust)</T>
      {Array.from({ length: 8 }, (_, k) => (
        <g key={`b${k}`}>
          <line x1={x0 + k * bw} y1={26} x2={x0 + k * bw} y2={38} stroke={tok('brand')} strokeWidth={1.5} />
          <T x={x0 + k * bw} y={48} size={11} mono anchor="middle" fill={tok('brand')}>{k}</T>
        </g>
      ))}
      {cells.map((c) => (
        <g key={c.c}>
          <Box x={c.x} y={62} w={c.w} h={44} r={3} fill={c.c === 'x' ? tok('safe', 0.16) : tok('panel')} stroke={c.c === 'x' ? tok('safe') : tok('ink', 0.5)}>
            <T x={c.x + c.w / 2} y={84} size={18} anchor="middle">{c.c}</T>
          </Box>
          <T x={c.x + c.w / 2} y={122} size={11} anchor="middle" fill={tok('muted')}>{`${c.bytes} B · ${c.units} unit${c.units > 1 ? 's' : ''}`}</T>
        </g>
      ))}
      <T x={x0} y={146} size={11} weight={700} fill={tok('accent')}>UTF-16 code units (acorn, JavaScript)</T>
      {[0, 1, 2, 3, 4].map((k) => {
        // unit k starts where its character (or the 😀's second half) does
        const xs = [x0, x0 + 2 * bw, x0 + 4 * bw, x0 + 6 * bw, x0 + 7 * bw];
        return (
          <g key={`u${k}`}>
            <line x1={xs[k]} y1={158} x2={xs[k]} y2={170} stroke={tok('accent')} strokeWidth={1.5} />
            <T x={xs[k]} y={180} size={11} mono anchor="middle" fill={tok('accent')}>{k}</T>
          </g>
        );
      })}
      <Arrow x1={x0 + 6 * bw + 30} y1={200} x2={x0 + 6 * bw + 8} y2={108} color={tok('safe')} width={1.6} />
      <T x={x0 + 6 * bw - 4} y={214} size={11} anchor="end" fill={tok('safe')}>x: byte 6 in Rust, unit 3 in JavaScript</T>
    </Svg>
  );
}
