// Chapter 339: the fields of drip-rs's Compiler<'src, 'a> (book/companion/
// rust/src/compiler.rs) and what they borrow. scanner, current and
// previous point into the source text (lifetime 'src); heap and roots are
// lent by the caller (lifetime 'a); functions is a Vec used as a stack,
// innermost last; everything else is owned by the struct.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const FIELDS: { name: string; kind: 'src' | 'a' | 'own' }[] = [
  { name: 'scanner', kind: 'src' },
  { name: 'current', kind: 'src' },
  { name: 'previous', kind: 'src' },
  { name: 'panic_mode', kind: 'own' },
  { name: 'block_depth', kind: 'own' },
  { name: 'syntax_errors', kind: 'own' },
  { name: 'static_errors', kind: 'own' },
  { name: 'functions', kind: 'own' },
  { name: 'classes', kind: 'own' },
  { name: 'heap', kind: 'a' },
  { name: 'roots', kind: 'a' },
];

export default function CompilerShape() {
  const fy = (k: number) => 34 + k * 24;
  const col = (kind: string) => (kind === 'src' ? tok('brand') : kind === 'a' ? tok('accent') : tok('line'));
  return (
    <Svg w={400} h={310} title="The Compiler struct's fields: three borrow the source, two borrow from the caller, the rest are owned">
      <T x={8} y={14} size={12} mono weight={700}>Compiler&lt;'src, 'a&gt;</T>
      {FIELDS.map((f, k) => (
        <Box key={f.name} x={8} y={fy(k)} w={140} h={20} r={3}
          fill={f.kind === 'own' ? tok('panel') : f.kind === 'src' ? tok('brand', 0.12) : tok('accent', 0.12)} stroke={col(f.kind)}>
          <T x={14} y={fy(k) + 10} size={12} mono>{f.name}</T>
        </Box>
      ))}
      {/* the source text */}
      <Box x={232} y={26} w={160} h={44} r={4} fill={tok('brand', 0.08)} stroke={tok('brand')}>
        <T x={240} y={40} size={11} weight={700} fill={tok('brand')}>source text ('src)</T>
        <T x={240} y={58} size={12} mono>fn f() &#123; print 1; &#125;</T>
      </Box>
      {[0, 1, 2].map((k) => (
        <Arrow key={k} x1={148} y1={fy(k) + 10} x2={230} y2={40 + k * 8} color={tok('brand')} width={1.5} />
      ))}
      {/* the stack of functions */}
      <T x={232} y={126} size={11} weight={700} fill={tok('muted')}>functions: a stack</T>
      <Box x={232} y={136} w={160} h={24} r={3} fill={tok('panel')} stroke={tok('line')}>
        <T x={240} y={148} size={12} mono>[0] script</T>
      </Box>
      <Box x={232} y={164} w={160} h={24} r={3} fill={tok('safe', 0.12)} stroke={tok('safe')}>
        <T x={240} y={176} size={12} mono>[1] f  ← last()</T>
      </Box>
      <Arrow x1={148} y1={fy(7) + 10} x2={230} y2={162} color={tok('safe')} width={1.5} />
      {/* lent by the caller */}
      <Box x={232} y={224} w={160} h={68} r={4} fill={tok('accent', 0.08)} stroke={tok('accent')}>
        <T x={240} y={238} size={11} weight={700} fill={tok('accent')}>lent by the caller ('a)</T>
        <T x={240} y={258} size={12} mono>Heap</T>
        <T x={240} y={278} size={12} mono>its GC roots</T>
      </Box>
      <Arrow x1={148} y1={fy(9) + 10} x2={230} y2={258} color={tok('accent')} width={1.5} />
      <Arrow x1={148} y1={fy(10) + 10} x2={230} y2={278} color={tok('accent')} width={1.5} />
    </Svg>
  );
}
