// Chapter 334: the bytes of four characters in UTF-8, in binary. The
// encodings are standard UTF-8 (checked with Rust's str::as_bytes):
// A = 0x41; é = 0xC3 0xA9; € = 0xE2 0x82 0xAC; 😀 = 0xF0 0x9F 0x98 0x80.
// The marker bits are coloured: 0 for an ASCII byte, 110/1110/11110 for
// a lead byte, 10 for a continuation byte.
import { Box, Svg, T, tok } from '../../viz/svg';

const ROWS = [
  { ch: 'A', bytes: [0x41] },
  { ch: 'é', bytes: [0xc3, 0xa9] },
  { ch: '€', bytes: [0xe2, 0x82, 0xac] },
  { ch: '😀', bytes: [0xf0, 0x9f, 0x98, 0x80] },
];

/** How many leading bits mark the byte's role. */
function marker(b: number, first: boolean): number {
  if (b < 0x80) return 1;
  if (!first) return 2;
  if (b >= 0xf0) return 5;
  if (b >= 0xe0) return 4;
  return 3;
}

export default function Utf8Shapes() {
  const x0 = 40;
  const bw = 88;
  return (
    <Svg w={400} h={236} title="Four characters as UTF-8 bytes in binary, with the marker bits coloured">
      <T x={x0} y={12} size={11} fill={tok('muted')}>byte 1</T>
      <T x={x0 + bw} y={12} size={11} fill={tok('muted')}>byte 2</T>
      <T x={x0 + 2 * bw} y={12} size={11} fill={tok('muted')}>byte 3</T>
      <T x={x0 + 3 * bw} y={12} size={11} fill={tok('muted')}>byte 4</T>
      {ROWS.map((r, i) => {
        const y = 24 + i * 44;
        return (
          <g key={r.ch}>
            <T x={14} y={y + 15} size={15} anchor="middle">{r.ch}</T>
            {r.bytes.map((b, k) => {
              const bits = b.toString(2).padStart(8, '0');
              const m = marker(b, k === 0);
              const col = b < 0x80 ? 'safe' : k === 0 ? 'brand' : 'accent';
              return (
                <g key={k}>
                  <Box x={x0 + k * bw} y={y} w={bw - 6} h={30} r={3} fill={tok(col, 0.1)} stroke={tok(col)} />
                  <text x={x0 + k * bw + 8} y={y + 12} fontSize={12} className="mono" dominantBaseline="middle">
                    <tspan fill={tok(col)} fontWeight={700}>{bits.slice(0, m)}</tspan>
                    <tspan fill={tok('ink')}>{bits.slice(m)}</tspan>
                  </text>
                  <T x={x0 + k * bw + 8} y={y + 24} size={11} mono fill={tok('muted')}>{b}</T>
                </g>
              );
            })}
          </g>
        );
      })}
      <T x={8} y={206} size={11} fill={tok('safe')}>0xxxxxxx: ASCII, 0 to 127</T>
      <T x={200} y={206} size={11} fill={tok('brand')}>11…: lead byte</T>
      <T x={8} y={226} size={11} fill={tok('accent')}>10xxxxxx: continuation, 128 to 191</T>
    </Svg>
  );
}
