import { Box, Svg, T, tok } from '../../viz/svg';

// Can rustc build a vtable? One row per method of a would-be trait: the
// method, whether it gets a slot, and why. Static.

const ROWS: { sig: string; ok: boolean | 'skip'; why: string }[] = [
  { sig: 'fn area(&self) -> f64', ok: true, why: 'one slot, fixed signature' },
  { sig: 'fn grow(&mut self, k: f64)', ok: true, why: 'one slot, &mut self is fine' },
  { sig: 'fn scaled(&self) -> Self', ok: false, why: 'size of Self unknown to caller' },
  { sig: 'fn put<T>(&self, x: T)', ok: false, why: 'needs one slot per T' },
  { sig: 'fn new() -> Self', ok: false, why: 'no self: no vtable to look in' },
  { sig: '… -> Self where Self: Sized', ok: 'skip', why: 'left out of the vtable' },
];

export default function VtableBuild() {
  return (
    <Svg w={400} h={262} title="Methods of a trait and whether each can get a vtable slot">
      <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>METHOD</T>
      <T x={392} y={12} size={11} weight={700} anchor="end" fill={tok('muted')}>VTABLE SLOT?</T>
      {ROWS.map((r, i) => {
        const y = 24 + i * 40;
        const c = r.ok === true ? 'safe' : r.ok === false ? 'danger' : 'muted';
        return (
          <g key={r.sig}>
            <Box x={8} y={y} w={384} h={34} r={4} fill={tok(c, 0.08)} stroke={tok(c)}>
              <T x={16} y={y + 11} size={11} mono>{r.sig}</T>
              <T x={16} y={y + 25} size={11} fill={tok('muted')}>{r.why}</T>
              <T x={382} y={y + 17} size={13} weight={700} anchor="end" fill={tok(c)}>
                {r.ok === true ? '✓ slot' : r.ok === false ? '✗ E0038' : '– none'}
              </T>
            </Box>
          </g>
        );
      })}
    </Svg>
  );
}
