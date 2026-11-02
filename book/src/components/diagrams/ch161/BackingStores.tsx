import { Box, Svg, T, tok } from '../../viz/svg';

// The three basic elements kinds and their backing stores, as
// %DebugPrint names them in Node v22.23.4 (V8 12.4): a FixedArray of
// Smis, a FixedDoubleArray of raw 64-bit doubles, and a FixedArray of
// tagged values, where anything that is not a Smi is a pointer to a heap
// object (a string, an object, a heap number).
const ROWS = [
  { kind: 'PACKED_SMI_ELEMENTS', store: 'FixedArray', cells: ['1', '2', '3'], note: 'small integers, tagged', ptr: false, c: 'brand' },
  { kind: 'PACKED_DOUBLE_ELEMENTS', store: 'FixedDoubleArray', cells: ['1.0', '2.0', '4.56'], note: 'raw 64-bit doubles, no tags', ptr: false, c: 'accent' },
  { kind: 'PACKED_ELEMENTS', store: 'FixedArray', cells: ['1', '•', '•'], note: 'anything: Smis or pointers', ptr: true, c: 'warn' },
];

export default function BackingStores() {
  return (
    <Svg w={400} h={206} title="Three arrays with their backing stores. SMI kind: a FixedArray holding the tagged small integers 1, 2, 3. DOUBLE kind: a FixedDoubleArray holding raw doubles 1.0, 2.0, 4.56. ELEMENTS kind: a FixedArray holding 1 and two pointers, one to a string and one to an object.">
      {ROWS.map((r, k) => {
        const y = 8 + k * 62;
        return (
          <g key={r.kind}>
            <T x={8} y={y + 6} size={11} mono weight={700} fill={tok(r.c)}>{r.kind}</T>
            <T x={392} y={y + 6} size={11} mono anchor="end" fill={tok('muted')}>{r.store}</T>
            {r.cells.map((v, j) => (
              <Box key={j} x={8 + j * 58} y={y + 16} w={54} h={30} r={3} fill={tok(r.c, 0.12)} stroke={tok(r.c)}>
                <T x={35 + j * 58} y={y + 31} size={12} mono anchor="middle">{v}</T>
              </Box>
            ))}
            <T x={190} y={y + 31} size={11} fill={tok('muted')}>{r.note}</T>
            {r.ptr && (
              <>
                <T x={190} y={y + 47} size={11} mono fill={tok('muted')}>• → "x" (string), {'{ }'} (object)</T>
              </>
            )}
          </g>
        );
      })}
    </Svg>
  );
}
