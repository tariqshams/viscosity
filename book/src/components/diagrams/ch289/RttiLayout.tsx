import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 289: the runtime type information clang emits for
// struct Circle : Shape (Itanium C++ ABI). The object's vptr leads to the
// vtable, whose slot before the methods points at Circle's typeinfo,
// which names the type and points at its base's typeinfo.
export default function RttiLayout() {
  return (
    <Svg w={400} h={232} title="An object's vptr points into the vtable for Circle; the slot before the methods points at typeinfo for Circle, which holds a name string 6Circle and a base pointer to typeinfo for Shape, which holds 5Shape and no base">
      <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>OBJECT</T>
      <Box x={8} y={22} w={84} h={52} fill={tok('f1', 0.1)} stroke={tok('f1')}>
        <T x={16} y={38} size={12} mono>vptr</T>
        <T x={16} y={60} size={12} mono>r = 1</T>
      </Box>
      <T x={120} y={12} size={11} weight={700} fill={tok('muted')}>VTABLE _ZTV6Circle</T>
      <Box x={120} y={22} w={124} h={92}>
        <T x={128} y={36} size={11} mono>0 (offset)</T>
        <T x={128} y={58} size={11} mono weight={700}>&amp;_ZTI6Circle</T>
        <T x={128} y={80} size={11} mono>~Shape()</T>
        <T x={128} y={100} size={11} mono>~Circle()</T>
      </Box>
      <Arrow x1={92} y1={38} x2={120} y2={72} color={tok('f1')} />
      <T x={8} y={92} size={11} fill={tok('muted')}>vptr points at</T>
      <T x={8} y={106} size={11} fill={tok('muted')}>the methods</T>
      <T x={8} y={136} size={11} weight={700} fill={tok('muted')}>TYPEINFO _ZTI6Circle</T>
      <Box x={8} y={146} w={168} h={70} fill={tok('f2', 0.1)} stroke={tok('f2')}>
        <T x={16} y={162} size={11} mono>kind: si_class</T>
        <T x={16} y={182} size={11} mono>name: "6Circle"</T>
        <T x={16} y={202} size={11} mono weight={700}>base: &amp;_ZTI5Shape</T>
      </Box>
      <Arrow x1={180} y1={58} x2={120} y2={146} color={tok('f2')} bend={-0.4} />
      <T x={224} y={136} size={11} weight={700} fill={tok('muted')}>TYPEINFO _ZTI5Shape</T>
      <Box x={224} y={146} w={168} h={50} fill={tok('f3', 0.1)} stroke={tok('f3')}>
        <T x={232} y={162} size={11} mono>kind: class (no base)</T>
        <T x={232} y={182} size={11} mono>name: "5Shape"</T>
      </Box>
      <Arrow x1={176} y1={202} x2={222} y2={182} color={tok('f3')} />
      <T x={8} y={228} size={11} fill={tok('muted')}>dynamic_cast walks the base pointers.</T>
    </Svg>
  );
}
