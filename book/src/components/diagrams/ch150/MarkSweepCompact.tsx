// Chapter 149b: the three tasks of V8's Mark-Compact collector, as
// "Trash talk" (2019) describes them: mark live objects from the roots;
// sweep the gaps left by dead objects into free-lists; compact (evacuate)
// only pages that a fragmentation heuristic picks, copying their
// survivors elsewhere. Two toy pages of six slots each.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

type Slot = 'live' | 'dead' | 'free' | 'moved' | 'empty';
const ROWS: { title: string; pages: Slot[][]; note: string }[] = [
  { title: '1. MARK', note: 'live objects found from the roots', pages: [['live', 'live', 'dead', 'live', 'live', 'dead'], ['dead', 'dead', 'live', 'dead', 'dead', 'dead']] },
  { title: '2. SWEEP', note: 'gaps go onto free-lists', pages: [['live', 'live', 'free', 'live', 'live', 'free'], ['free', 'free', 'live', 'free', 'free', 'free']] },
  { title: '3. COMPACT (some pages)', note: 'B evacuated, A only swept', pages: [['live', 'live', 'moved', 'live', 'live', 'free'], ['empty', 'empty', 'empty', 'empty', 'empty', 'empty']] },
];

const SW = 26;

function fill(s: Slot) {
  if (s === 'live') return tok('safe', 0.35);
  if (s === 'moved') return tok('brand', 0.35);
  return 'transparent';
}
function stroke(s: Slot) {
  if (s === 'live') return tok('safe');
  if (s === 'moved') return tok('brand');
  if (s === 'dead') return tok('danger');
  return tok('line');
}

export default function MarkSweepCompact() {
  return (
    <Svg w={400} h={262} title="Mark finds the live objects; sweep turns the gaps into free-list entries; compact evacuates a badly fragmented page, moving its one survivor into a free slot elsewhere, and leaves the other page swept only.">
      {ROWS.map((r, k) => {
        const y = 14 + k * 82;
        return (
          <g key={k}>
            <T x={6} y={y} size={11} weight={700} fill={tok('muted')}>{r.title}</T>
            <T x={394} y={y} size={11} anchor="end" fill={tok('muted')}>{r.note}</T>
            {r.pages.map((pg, j) => {
              const px = 6 + j * 200;
              return (
                <g key={j}>
                  <Box x={px} y={y + 12} w={182} h={46} fill={tok('panel')} stroke={tok('ink', 0.4)}>
                    <T x={px + 8} y={y + 24} size={11} fill={tok('muted')}>page {j === 0 ? 'A' : 'B'}</T>
                    {pg.map((s, i) => (
                      <Box key={i} x={px + 8 + i * (SW + 3)} y={y + 32} w={SW} h={20} r={2} fill={fill(s)} stroke={stroke(s)} dash={s === 'dead' || s === 'free' || s === 'empty'} />
                    ))}
                  </Box>
                </g>
              );
            })}
          </g>
        );
      })}
      <Arrow x1={285} y1={150} x2={86} y2={208} color={tok('brand')} bend={0.4} dash />
      <Box x={6} y={240} w={14} h={12} r={2} fill={tok('safe', 0.35)} stroke={tok('safe')} />
      <T x={24} y={246} size={11}>live</T>
      <Box x={62} y={240} w={14} h={12} r={2} fill="transparent" stroke={tok('danger')} dash />
      <T x={80} y={246} size={11}>dead</T>
      <Box x={120} y={240} w={14} h={12} r={2} fill="transparent" stroke={tok('line')} dash />
      <T x={138} y={246} size={11}>free</T>
      <Box x={176} y={240} w={14} h={12} r={2} fill={tok('brand', 0.35)} stroke={tok('brand')} />
      <T x={194} y={246} size={11}>moved here</T>
    </Svg>
  );
}
