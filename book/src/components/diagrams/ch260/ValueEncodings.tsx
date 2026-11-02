// Chapter 260: one number, three engines. Sources:
// - V8: a small integer is a Smi kept in the value itself; a double held in
//   an object's field lives in a separate HeapNumber. Seen with %DebugPrint
//   on Node v22.23.4 (V8 12.4): `#y: 2` and `#x: <HeapNumber 1.5>`.
// - SpiderMonkey (js/public/Value.h): doubles are stored as their own IEEE
//   bits; int32s and other values are NaN patterns carrying a tag.
// - JavaScriptCore (runtime/JSCJSValue.h): int32s carry the tag 0xFFFE in
//   the top 16 bits; doubles are stored as their bits plus 2^49; pointers
//   are stored as they are, so their top 16 bits are 0000.
import { Box, Svg, T, tok } from '../../viz/svg';

const ROWS: { engine: string; five: string[]; onePointFive: string[] }[] = [
  { engine: 'V8', five: ['Smi: 5 kept', 'in the value itself'], onePointFive: ['as a field: pointer', 'to a HeapNumber 1.5'] },
  { engine: 'SpiderMonkey', five: ['NaN pattern with', 'the int32 tag, then 5'], onePointFive: ['its own bits:', '3FF80000 00000000'] },
  { engine: 'JavaScriptCore', five: ['FFFE0000 00000005', '(int32 tag 0xFFFE)'], onePointFive: ['bits + 2^49:', '3FFA0000 00000000'] },
];

export default function ValueEncodings() {
  const c1 = 108;
  const c2 = 256;
  return (
    <Svg w={400} h={232} title="How V8, SpiderMonkey and JavaScriptCore store the numbers 5 and 1.5 in a 64-bit value">
      <T x={6} y={14} size={11} weight={700} fill={tok('muted')}>ENGINE</T>
      <T x={c1} y={14} size={11} weight={700} fill={tok('muted')}>THE NUMBER 5</T>
      <T x={c2} y={14} size={11} weight={700} fill={tok('muted')}>THE NUMBER 1.5</T>
      {ROWS.map((r, k) => {
        const y = 28 + k * 62;
        const mono = (s: string) => /^[0-9A-F]{8} /.test(s);
        return (
          <g key={r.engine}>
            <T x={6} y={y + 26} size={12} weight={700}>{r.engine}</T>
            <Box x={c1 - 6} y={y} w={140} h={52} fill={tok('f2', 0.12)} stroke={tok('f2')}>
              {r.five.map((t, i) => (
                <T key={i} x={c1} y={y + 17 + i * 18} size={11} mono={mono(t)}>{t}</T>
              ))}
            </Box>
            <Box x={c2 - 6} y={y} w={146} h={52} fill={tok('f3', 0.12)} stroke={tok('f3')}>
              {r.onePointFive.map((t, i) => (
                <T key={i} x={c2} y={y + 17 + i * 18} size={11} mono={mono(t)}>{t}</T>
              ))}
            </Box>
          </g>
        );
      })}
      <T x={6} y={222} size={11} fill={tok('muted')}>Hex digits: the 64 bits, high half first.</T>
    </Svg>
  );
}
