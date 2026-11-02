// Chapter 249: collection discovery as a flow of one fact, "refers to ps",
// along def-use edges of the real VIR of
//   const ps = [];
//   for (let i = 0; i < 100; i++) ps.push({ x: i, vx: 1 });
//   function step(qs) { for (...) qs[i].x += qs[i].vx; }
//   step(ps); step(ps);
//   console.log(ps[3].x);
// Value numbers are the engine's own (printFunc). Every call of step passes
// ps, so the fact crosses into the parameter %0 of step.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

function N({ x, y, w = 84, top, sub, kind }: { x: number; y: number; w?: number; top: string; sub: string; kind: 'ref' | 'use' | 'src' }) {
  const stroke = kind === 'use' ? tok('safe') : tok('brand');
  const fill = kind === 'ref' ? tok('brand', 0.14) : kind === 'src' ? tok('brand', 0.28) : tok('safe', 0.1);
  return (
    <Box x={x} y={y} w={w} h={36} stroke={stroke} fill={fill}>
      <T x={x + w / 2} y={y + 12} size={11} mono anchor="middle" weight={700}>{top}</T>
      <T x={x + w / 2} y={y + 27} size={11} anchor="middle" fill={tok('muted')}>{sub}</T>
    </Box>
  );
}

export default function RefsFlow() {
  return (
    <Svg w={400} h={300} title="The fact refers-to-ps starts at the store of an empty array, reaches four loads of ps, crosses both calls of step into its parameter, and ends at uses Viscosity can rewrite: push, length and index.get.">
      <N x={128} y={4} w={144} top="store ps, %17" sub="%17 = array.empty" kind="src" />
      <Arrow x1={170} y1={42} x2={50} y2={66} />
      <Arrow x1={190} y1={42} x2={150} y2={66} />
      <Arrow x1={210} y1={42} x2={250} y2={66} />
      <Arrow x1={230} y1={42} x2={350} y2={66} />
      <N x={8} y={68} top="%23 load ps" sub="line 3" kind="ref" />
      <N x={108} y={68} top="%31 load ps" sub="step(ps)" kind="ref" />
      <N x={208} y={68} top="%34 load ps" sub="step(ps)" kind="ref" />
      <N x={308} y={68} top="%38 load ps" sub="line 10" kind="ref" />
      <Arrow x1={50} y1={106} x2={50} y2={130} color={tok('safe')} />
      <Arrow x1={350} y1={106} x2={350} y2={130} color={tok('safe')} />
      <N x={8} y={132} top="push" sub="{x, vx}" kind="use" />
      <N x={308} y={132} top="index.get" sub="ps[3]" kind="use" />
      <Arrow x1={150} y1={106} x2={192} y2={176} />
      <Arrow x1={250} y1={106} x2={208} y2={176} />
      <T x={200} y={136} size={11} anchor="middle" fill={tok('muted')}>both calls</T>
      <T x={200} y={150} size={11} anchor="middle" fill={tok('muted')}>pass ps</T>
      <N x={140} y={178} w={120} top="%0 param qs" sub="in step()" kind="ref" />
      <Arrow x1={165} y1={216} x2={60} y2={240} color={tok('safe')} />
      <Arrow x1={200} y1={216} x2={200} y2={240} color={tok('safe')} />
      <Arrow x1={235} y1={216} x2={340} y2={240} color={tok('safe')} />
      <N x={18} y={242} top=".length" sub="%4, line 5" kind="use" />
      <N x={158} y={242} top="index.get" sub="%6, qs[i]" kind="use" />
      <N x={298} y={242} top="index.get" sub="%8, qs[i]" kind="use" />
      <T x={200} y={292} size={11} anchor="middle" fill={tok('muted')}>orange: refers to ps · green: a use it can rewrite</T>
    </Svg>
  );
}
