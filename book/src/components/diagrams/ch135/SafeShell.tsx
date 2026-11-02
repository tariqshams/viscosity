// Chapter 135: the usual shape of unsafe code. Callers only see a safe
// function; its own check makes the unsafe call's promise true; the
// unsafe block is a few lines inside. This is how the Rust book describes
// safe abstractions over unsafe code (ch20-01, "Creating a Safe
// Abstraction over Unsafe Code").
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

export default function SafeShell() {
  return (
    <Svg w={400} h={232} title="Three nested boxes: callers outside, a safe function with a bounds check, and a small unsafe block inside it">
      <Box x={8} y={8} w={384} h={216} r={8} fill={tok('panel')} stroke={tok('line')}>
        <T x={20} y={26} size={12} weight={700} fill={tok('muted')}>callers: any i at all, safe code only</T>
        <T x={20} y={46} size={11} mono fill={tok('ink')}>at(&amp;xs, 2)   at(&amp;xs, 99)</T>
      </Box>
      <Box x={36} y={62} w={328} h={150} r={8} fill={tok('safe', 0.08)} stroke={tok('safe')}>
        <T x={48} y={80} size={12} weight={700} fill={tok('safe')}>fn at(xs, i) -&gt; Option&lt;f64&gt;</T>
        <T x={48} y={102} size={11} mono fill={tok('ink')}>if i &gt;= xs.len() {'{'} return None; {'}'}</T>
        <T x={48} y={120} size={11} fill={tok('muted')}>the check that makes the promise true</T>
      </Box>
      <Box x={64} y={134} w={272} h={66} r={8} fill={tok('warn', 0.12)} stroke={tok('warn')}>
        <T x={76} y={150} size={11} mono fill={tok('muted')}>// SAFETY: i &lt; xs.len()</T>
        <T x={76} y={170} size={11} mono fill={tok('ink')}>unsafe {'{'} *xs.get_unchecked(i) {'}'}</T>
        <T x={76} y={188} size={11} fill={tok('warn')}>the only lines a reviewer must prove</T>
      </Box>
      <Arrow x1={200} y1={52} x2={200} y2={64} color={tok('ink', 0.5)} />
    </Svg>
  );
}
