// Chapter 187: what makes a run of instructions a basic block. Left: one way
// in at the top, one way out at the bottom. Right: a jump lands in the middle
// and another leaves from the middle, so the run must be cut in two places.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const LEFT = ['t2 = n % 2', 'ifnot t2 goto 7'];
const RIGHT = ['t3 = 3 * n', 'n = t3 + 1', 'goto 0', 'n = n / 2', 'goto 0'];

export default function OneEntryOneExit() {
  return (
    <Svg w={400} h={250} title="Left: a basic block of two instructions, entered only at the top and left only at the bottom. Right: five instructions where a jump arrives at the fourth and the third jumps away, so they form two blocks, cut after goto 0.">
      <T x={10} y={14} size={11} weight={700} fill={tok('brand')}>a basic block</T>
      <Arrow x1={80} y1={30} x2={80} y2={56} color={tok('brand')} />
      <T x={88} y={40} size={11} fill={tok('muted')}>in</T>
      <Box x={10} y={58} w={150} h={52} fill={tok('brand', 0.1)} stroke={tok('brand')}>
        {LEFT.map((l, k) => <T key={k} x={18} y={74 + k * 20} size={12} mono>{l}</T>)}
      </Box>
      <Arrow x1={80} y1={112} x2={80} y2={140} color={tok('brand')} />
      <T x={88} y={128} size={11} fill={tok('muted')}>out</T>
      <T x={10} y={166} size={11} fill={tok('muted')}>enter at the top,</T>
      <T x={10} y={182} size={11} fill={tok('muted')}>leave after the last;</T>
      <T x={10} y={198} size={11} fill={tok('muted')}>if one line runs,</T>
      <T x={10} y={214} size={11} fill={tok('muted')}>they all run</T>

      <T x={214} y={14} size={11} weight={700} fill={tok('accent')}>not one block</T>
      <Arrow x1={280} y1={30} x2={280} y2={44} color={tok('ink', 0.7)} />
      <Box x={214} y={46} w={150} h={108} fill={tok('panel')} stroke={tok('line')}>
        {RIGHT.map((l, k) => <T key={k} x={222} y={62 + k * 20} size={12} mono>{l}</T>)}
      </Box>
      <line x1={208} y1={112} x2={370} y2={112} stroke={tok('accent')} strokeWidth={2} strokeDasharray="5 4" />
      <Arrow x1={398} y1={70} x2={366} y2={122} color={tok('accent')} bend={-0.4} />
      <T x={398} y={58} size={11} anchor="end" fill={tok('accent')}>jump in</T>
      <Arrow x1={366} y1={102} x2={398} y2={102} color={tok('accent')} />
      <T x={214} y={176} size={11} fill={tok('muted')}>goto 0 leaves in the middle,</T>
      <T x={214} y={192} size={11} fill={tok('muted')}>and a jump lands on the line</T>
      <T x={214} y={208} size={11} fill={tok('muted')}>after it: cut there (dashed),</T>
      <T x={214} y={224} size={11} fill={tok('muted')}>giving two blocks</T>
    </Svg>
  );
}
