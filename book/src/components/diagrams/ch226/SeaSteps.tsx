import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 226: one small function as a sea of nodes. Data edges (value
// uses) and control edges are separate; x * c has no control input, so it
// floats, and global code motion then places it: early is the entry block,
// late is the only block that uses it, and the latest block outside any
// extra loop wins.
type View = 'list' | 'data' | 'control' | 'float' | 'early' | 'late' | 'placed';
type S = { v: View; note: string };

const STATES: S[] = [
  { v: 'list', note: 'As a list (three-address code in blocks), y = x * c sits in the entry block, before the branch, because that is where the source wrote it. Yet only the else path uses y.' },
  { v: 'data', note: 'As a sea of nodes, each instruction is a node of its own. Orange arrows are data edges: they show which value feeds which. x * c needs x and c; return y needs the product; the if needs b.' },
  { v: 'control', note: 'Blue arrows are control edges. They order the nodes that must happen in order: start, then the if, then one of its two arms, then that arm’s return.' },
  { v: 'float', note: 'x * c has data edges but no control edge. Nothing ties it to a block: it floats. Only its inputs and its users limit where it may go.' },
  { v: 'early', note: 'Schedule early: the first place it could run is the first block where all its inputs exist. x and c are parameters, available from the start, so early is the entry block.' },
  { v: 'late', note: 'Schedule late: the last place it could run is the nearest block that dominates all its uses. Its only use is return y, in the else arm, so late is the else block.' },
  { v: 'placed', note: 'Pick a block on the dominator-tree path from late up to early, in the shallowest loop, and as late as possible. There are no loops here, so x * c goes in the else arm: when b is true it is never computed.' },
];

const DATA = tok('brand');
const CTRL = tok('accent');

function node(x: number, y: number, w: number, label: string, hot = false, dim = false) {
  return (
    <Box x={x} y={y} w={w} h={28} fill={hot ? tok('brand', 0.15) : tok('panel')} stroke={hot ? tok('brand') : tok('line')} opacity={dim ? 0.35 : 1}>
      <T x={x + w / 2} y={y + 14} size={12.5} mono anchor="middle">{label}</T>
    </Box>
  );
}

function ListView() {
  const rows = ['entry:', '  y = x * c', '  if b goto then', '  else goto else', 'then:', '  return 0', 'else:', '  return y'];
  return (
    <g>
      {rows.map((r, k) => (
        <T key={k} x={40} y={22 + k * 26} size={13} mono fill={k === 1 ? tok('brand') : undefined} weight={k === 1 ? 700 : undefined}>{r}</T>
      ))}
      <Box x={30} y={33} w={150} h={22} fill="transparent" stroke={tok('brand')} />
      <T x={200} y={44} size={11.5} fill={tok('muted')}>fixed here by the list</T>
    </g>
  );
}

export default function SeaSteps() {
  const s = useSteps(STATES);
  const v = s.state.v;
  const k = STATES.findIndex((x) => x.v === v);
  const showCtrl = k >= 2;
  const placed = v === 'placed';
  const mx = placed ? 250 : 236;
  const my = placed ? 160 : 90;
  return (
    <StepFrame title="A sea of nodes, then global code motion" steps={s} note={s.state.note}>
      <Svg w={400} h={250} title="A function as a sea of nodes: data edges, control edges, and a floating multiply that is placed in the else arm">
        {v === 'list' ? <ListView /> : (
          <g>
            {/* data inputs */}
            {node(176, 8, 44, 'x')}
            {node(232, 8, 44, 'c')}
            {node(300, 8, 44, 'b')}
            {/* control chain */}
            {node(14, 8, 80, 'start')}
            {node(14, 68, 80, 'if')}
            {node(14, 128, 80, 'then')}
            {node(120, 128, 80, 'else')}
            {node(14, 196, 80, 'return 0')}
            {node(120, 196, 80, 'return y')}
            {node(mx, my, 70, 'x * c', k >= 3)}
            {/* data edges (input to user) */}
            <Arrow x1={198} y1={36} x2={mx + 22} y2={my} color={DATA} />
            <Arrow x1={254} y1={36} x2={mx + 50} y2={my} color={DATA} />
            <Arrow x1={mx + 20} y1={my + 28} x2={186} y2={196} color={DATA} />
            <Arrow x1={322} y1={36} x2={94} y2={82} color={DATA} />
            {showCtrl && (
              <g>
                <Arrow x1={54} y1={36} x2={54} y2={68} color={CTRL} />
                <Arrow x1={44} y1={96} x2={44} y2={128} color={CTRL} />
                <Arrow x1={84} y1={96} x2={140} y2={128} color={CTRL} />
                <Arrow x1={54} y1={156} x2={54} y2={196} color={CTRL} />
                <Arrow x1={160} y1={156} x2={160} y2={196} color={CTRL} />
              </g>
            )}
            {v === 'early' && <T x={mx + 35} y={my - 10} size={11.5} weight={700} anchor="middle" fill={tok('safe')}>earliest: entry</T>}
            {v === 'late' && <T x={mx + 35} y={my + 42} size={11.5} weight={700} anchor="middle" fill={tok('warn')}>latest: else</T>}
            {placed && <T x={mx + 35} y={my + 42} size={11.5} weight={700} anchor="middle" fill={tok('safe')}>placed in else</T>}
            <T x={14} y={240} size={11} fill={DATA}>data edge</T>
            <T x={90} y={240} size={11} fill={showCtrl ? CTRL : tok('muted')}>control edge</T>
          </g>
        )}
      </Svg>
    </StepFrame>
  );
}
