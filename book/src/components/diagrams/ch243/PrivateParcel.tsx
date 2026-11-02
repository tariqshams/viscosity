import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 243: what travels from lower to emit. The JavaScript plugin
// returns a JsLowered (frontend-js/src/index.ts): the LoweredModule part
// the core reads (module, annotations) plus private fields the core passes
// along unread (program, resolution, js).
export default function PrivateParcel() {
  return (
    <Svg w={400} h={300} title="The object lower returns: a public part the core reads, and a private part only the plugin's emit opens">
      <Box x={8} y={8} w={120} h={36} fill={tok('f3', 0.15)} stroke={tok('f3')}>
        <T x={68} y={26} size={12} anchor="middle" weight={700}>lower(source)</T>
      </Box>
      <Arrow x1={68} y1={44} x2={68} y2={70} />
      <T x={140} y={26} size={11} fill={tok('muted')}>returns one object, a JsLowered:</T>

      <Box x={8} y={70} w={384} h={120} fill="transparent" stroke={tok('f3')}>
        <Box x={18} y={82} w={170} h={96} fill={tok('brand', 0.1)} stroke={tok('brand')}>
          <T x={103} y={98} size={11} anchor="middle" weight={700} fill={tok('brand')}>LoweredModule</T>
          <T x={30} y={124} size={12} mono>module</T>
          <T x={30} y={146} size={12} mono>annotations</T>
          <T x={103} y={168} size={11} anchor="middle" fill={tok('muted')}>the core reads this</T>
        </Box>
        <Box x={204} y={82} w={178} h={96} fill={tok('f3', 0.08)} stroke={tok('f3')} dash>
          <T x={293} y={98} size={11} anchor="middle" weight={700} fill={tok('f3')}>private to the plugin</T>
          <T x={216} y={124} size={12} mono>program  (ESTree)</T>
          <T x={216} y={146} size={12} mono>resolution, js</T>
          <T x={293} y={168} size={11} anchor="middle" fill={tok('muted')}>passed along unread</T>
        </Box>
      </Box>

      <Arrow x1={103} y1={190} x2={103} y2={222} color={tok('brand')} />
      <Box x={8} y={222} w={190} h={36} fill={tok('brand', 0.12)} stroke={tok('brand')}>
        <T x={103} y={240} size={11} anchor="middle" weight={700}>analyze(module) · plan</T>
      </Box>
      <Arrow x1={293} y1={190} x2={293} y2={222} color={tok('f3')} />
      <Arrow x1={198} y1={240} x2={210} y2={240} color={tok('brand')} />
      <Box x={210} y={222} w={182} h={36} fill={tok('f3', 0.15)} stroke={tok('f3')}>
        <T x={301} y={240} size={11} anchor="middle" weight={700}>emit(source, lowered, plan)</T>
      </Box>
      <T x={200} y={284} size={11} anchor="middle" fill={tok('muted')}>The core passes the whole object to emit without opening it.</T>
    </Svg>
  );
}
