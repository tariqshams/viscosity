import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 311-b: what each language builds for the same chain. JavaScript's
// Array.prototype.filter and map each return a new array; Rust's filter and
// map each wrap the iterator in a small struct (Filter, Map), and nothing
// is computed until a consumer such as sum calls next.
export default function ChainShapes() {
  return (
    <Svg w={400} h={232} title="JavaScript builds an array per stage; Rust nests iterator structs and pulls items through them">
      <T x={8} y={14} size={12} weight={700} fill={tok('muted')}>JAVASCRIPT: xs.filter(f).map(g).reduce(h, 0)</T>
      <Box x={8} y={26} w={56} h={30} fill={tok('panel')} stroke={tok('ink', 0.5)}><T x={36} y={41} size={12} mono anchor="middle">xs</T></Box>
      <Arrow x1={66} y1={41} x2={100} y2={41} />
      <Box x={102} y={26} w={74} h={30} fill={tok('warn', 0.15)} stroke={tok('warn')}><T x={139} y={41} size={11} mono anchor="middle">[array]</T></Box>
      <Arrow x1={178} y1={41} x2={212} y2={41} />
      <Box x={214} y={26} w={74} h={30} fill={tok('warn', 0.15)} stroke={tok('warn')}><T x={251} y={41} size={11} mono anchor="middle">[array]</T></Box>
      <Arrow x1={290} y1={41} x2={324} y2={41} />
      <Box x={326} y={26} w={66} h={30} fill={tok('panel')} stroke={tok('ink', 0.5)}><T x={359} y={41} size={12} mono anchor="middle">total</T></Box>
      <T x={83} y={70} size={11} anchor="middle" fill={tok('muted')}>filter</T>
      <T x={195} y={70} size={11} anchor="middle" fill={tok('muted')}>map</T>
      <T x={307} y={70} size={11} anchor="middle" fill={tok('muted')}>reduce</T>
      <T x={8} y={90} size={11} fill={tok('warn')}>two whole new arrays, filled one stage at a time</T>

      <line x1={4} y1={104} x2={396} y2={104} stroke={tok('line')} strokeWidth={1} />

      <T x={8} y={122} size={12} weight={700} fill={tok('muted')}>RUST: xs.iter().filter(f).map(g).sum()</T>
      <Box x={8} y={134} w={290} h={70} r={8} fill={tok('brand', 0.06)} stroke={tok('brand')}>
        <T x={18} y={148} size={11} mono weight={700} fill={tok('brand')}>Map</T>
        <Box x={22} y={156} w={262} h={42} r={7} fill={tok('safe', 0.08)} stroke={tok('safe')}>
          <T x={32} y={168} size={11} mono weight={700} fill={tok('safe')}>Filter</T>
          <Box x={92} y={162} w={184} h={30} r={6} fill={tok('panel')} stroke={tok('ink', 0.5)}>
            <T x={184} y={177} size={11} mono anchor="middle">slice::Iter over xs</T>
          </Box>
        </Box>
      </Box>
      <Arrow x1={344} y1={169} x2={302} y2={169} color={tok('brand')} />
      <T x={346} y={164} size={12} mono>sum</T>
      <T x={346} y={180} size={11} fill={tok('muted')}>calls next</T>
      <T x={8} y={222} size={11} fill={tok('safe')}>three small structs, no arrays; one item travels through at a time</T>
    </Svg>
  );
}
