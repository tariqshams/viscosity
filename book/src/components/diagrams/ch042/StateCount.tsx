import { Box, Svg, T, tok } from '../../viz/svg';

// Every combination the flag bag allows, and which of them make sense.
const FLAGS: { loading: boolean; text: boolean; error: boolean; ok?: string }[] = [
  { loading: true, text: false, error: false, ok: 'loading' },
  { loading: true, text: true, error: false },
  { loading: true, text: false, error: true },
  { loading: true, text: true, error: true },
  { loading: false, text: false, error: false },
  { loading: false, text: true, error: false, ok: 'loaded' },
  { loading: false, text: false, error: true, ok: 'failed' },
  { loading: false, text: true, error: true },
];

const UNION = [
  { kind: 'loading', extra: '' },
  { kind: 'loaded', extra: 'text' },
  { kind: 'failed', extra: 'error' },
];

/** 2 × 2 × 2 = 8 states for the flags, of which 3 make sense; 1 + 1 + 1 = 3 for the union. */
export default function StateCount() {
  return (
    <Svg w={400} h={262} title="Top: the eight combinations the Flags type allows, loading true or false, text there or not, error there or not. Only three make sense: loading with nothing else, loaded with text, failed with an error. The other five are crossed out. Bottom: the Status union allows exactly the three that make sense.">
      <T x={6} y={12} size={11} weight={700} fill={tok('muted')}>FLAGS: 2 × 2 × 2 = 8 STATES</T>
      {FLAGS.map((f, k) => {
        const x = 6 + (k % 4) * 98;
        const y = 24 + Math.floor(k / 4) * 70;
        const c = f.ok ? 'safe' : 'danger';
        return (
          <g key={k}>
            <Box x={x} y={y} w={92} h={62} fill={tok(c, 0.1)} stroke={tok(c)}>
              <T x={x + 8} y={y + 13} size={11} mono>{`loading: ${f.loading ? 'T' : 'F'}`}</T>
              <T x={x + 8} y={y + 28} size={11} mono opacity={f.text ? 1 : 0.45}>{f.text ? 'text ✓' : 'text –'}</T>
              <T x={x + 8} y={y + 43} size={11} mono opacity={f.error ? 1 : 0.45}>{f.error ? 'error ✓' : 'error –'}</T>
              <T x={x + 84} y={y + 13} size={12} weight={700} anchor="end" fill={tok(c)}>{f.ok ? '✓' : '✗'}</T>
              {f.ok && <T x={x + 84} y={y + 54} size={11} weight={700} anchor="end" fill={tok('safe')}>{f.ok}</T>}
            </Box>
          </g>
        );
      })}
      <T x={6} y={180} size={11} weight={700} fill={tok('muted')}>STATUS UNION: 1 + 1 + 1 = 3 STATES</T>
      {UNION.map((u, k) => {
        const x = 6 + k * 131;
        return (
          <Box key={k} x={x} y={192} w={125} h={62} fill={tok('safe', 0.1)} stroke={tok('safe')}>
            <T x={x + 10} y={212} size={12} mono weight={700}>{`kind: '${u.kind}'`}</T>
            <T x={x + 10} y={232} size={11} mono opacity={u.extra ? 1 : 0.5}>{u.extra ? `${u.extra}: string` : 'nothing else'}</T>
          </Box>
        );
      })}
    </Svg>
  );
}
