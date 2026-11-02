// Chapter 215: inserting a loop preheader. Before: the header h is entered
// from a and from c. After: a new block P takes both entering edges.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const W = 40;
const H = 24;

function Node({ x, y, name, kind }: { x: number; y: number; name: string; kind?: 'loop' | 'new' }) {
  return (
    <Box x={x - W / 2} y={y - H / 2} w={W} h={H} r={5}
      fill={kind === 'loop' ? tok('brand', 0.16) : kind === 'new' ? tok('accent', 0.16) : tok('panel')}
      stroke={kind === 'loop' ? tok('brand') : kind === 'new' ? tok('accent') : tok('line')}>
      <T x={x} y={y} size={13} mono weight={700} anchor="middle">{name}</T>
    </Box>
  );
}

const ink = tok('ink', 0.55);

export default function PreheaderFigure() {
  return (
    <Svg w={400} h={240} title="Before and after adding a preheader P in front of loop header h">
      <T x={100} y={14} size={12} weight={700} anchor="middle" fill={tok('muted')}>BEFORE</T>
      <T x={300} y={14} size={12} weight={700} anchor="middle" fill={tok('muted')}>AFTER</T>
      <line x1={200} y1={24} x2={200} y2={232} stroke={tok('line')} strokeWidth={1} />

      {/* before */}
      <Arrow x1={64} y1={52} x2={92} y2={104} color={ink} width={1.6} />
      <Arrow x1={136} y1={52} x2={108} y2={104} color={ink} width={1.6} />
      <Arrow x1={100} y1={128} x2={100} y2={164} color={ink} width={1.6} />
      <Arrow x1={80} y1={176} x2={80} y2={118} bend={-1.2} color={tok('danger')} width={2.2} dash />
      <Arrow x1={120} y1={116} x2={160} y2={200} color={ink} width={1.6} />
      <Node x={60} y={40} name="a" />
      <Node x={140} y={40} name="c" />
      <Node x={100} y={116} name="h" kind="loop" />
      <Node x={100} y={176} name="t" kind="loop" />
      <Node x={162} y={212} name="x" />

      {/* after */}
      <Arrow x1={264} y1={52} x2={292} y2={84} color={ink} width={1.6} />
      <Arrow x1={336} y1={52} x2={308} y2={84} color={ink} width={1.6} />
      <Arrow x1={300} y1={108} x2={300} y2={130} color={ink} width={1.6} />
      <Arrow x1={300} y1={154} x2={300} y2={176} color={ink} width={1.6} />
      <Arrow x1={280} y1={188} x2={280} y2={144} bend={-1.2} color={tok('danger')} width={2.2} dash />
      <Arrow x1={320} y1={142} x2={360} y2={200} color={ink} width={1.6} />
      <Node x={260} y={40} name="a" />
      <Node x={340} y={40} name="c" />
      <Node x={300} y={96} name="P" kind="new" />
      <Node x={300} y={142} name="h" kind="loop" />
      <Node x={300} y={188} name="t" kind="loop" />
      <Node x={362} y={212} name="x" />
      <T x={330} y={96} size={11} fill={tok('accent')}>new</T>
      <T x={8} y={232} size={11} fill={tok('muted')}>dashed = back edge</T>
    </Svg>
  );
}
