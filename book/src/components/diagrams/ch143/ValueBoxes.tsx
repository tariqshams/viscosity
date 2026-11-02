import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// The kinds of Drip value, each drawn as a tag plus a payload. Only an
// object's payload leaves the slot: it is an arrow to the heap.
export const TAG_COLOUR: Record<string, string> = {
  none: 'muted', bool: 'safe', num: 'accent', obj: 'brand',
};

const ROWS = [
  { tag: 'none', payload: '(nothing)', faint: true },
  { tag: 'bool', payload: 'true' },
  { tag: 'num', payload: '3.5' },
  { tag: 'obj', payload: 'address' },
];

export default function ValueBoxes() {
  return (
    <Svg w={400} h={236} title="Four tagged values: none, a boolean, a number and an object. Each has a tag and a payload; the object's payload points to a string on the heap.">
      <T x={14} y={14} size={11} weight={700} fill={tok('muted')}>TAG</T>
      <T x={84} y={14} size={11} weight={700} fill={tok('muted')}>PAYLOAD</T>
      <T x={264} y={14} size={11} weight={700} fill={tok('muted')}>HEAP</T>
      {ROWS.map((r, k) => {
        const y = 28 + k * 46;
        const c = TAG_COLOUR[r.tag];
        return (
          <g key={r.tag}>
            <Box x={10} y={y} w={62} h={34} r={4} fill={tok(c, 0.2)} stroke={tok(c)}>
              <T x={41} y={y + 17} size={14} mono weight={700} anchor="middle">{r.tag}</T>
            </Box>
            <Box x={74} y={y} w={120} h={34} r={4} stroke={tok('ink', 0.5)}>
              <T x={134} y={y + 17} size={14} mono anchor="middle" fill={r.faint ? tok('muted') : tok('ink')}>{r.payload}</T>
            </Box>
          </g>
        );
      })}
      <Arrow x1={194} y1={28 + 3 * 46 + 17} x2={262} y2={182} />
      <Box x={264} y={160} w={128} h={46} r={8} fill={tok('brand', 0.12)} stroke={tok('brand')}>
        <T x={274} y={174} size={11} fill={tok('muted')}>string object</T>
        <T x={274} y={192} size={14} mono>"hello"</T>
      </Box>
      <T x={10} y={226} size={11} fill={tok('muted')}>Every slot is the same size. Big things live elsewhere.</T>
    </Svg>
  );
}
