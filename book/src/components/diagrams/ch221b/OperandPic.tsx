// Chapter 221b: the same IR instruction, field.set, with the element in
// two different operand positions. As the object written to, it is safe;
// as the value stored, it escapes into another object.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

function Side({ x, title, code, ir, obj, val, ok }: { x: number; title: string; code: string; ir: string; obj: string; val: string; ok: boolean }) {
  const c = ok ? 'safe' : 'danger';
  return (
    <g>
      <T x={x + 92} y={14} size={12} weight={700} anchor="middle" fill={tok(c)}>{title}</T>
      <T x={x + 92} y={36} size={12} mono anchor="middle">{code}</T>
      <T x={x + 92} y={58} size={11} mono anchor="middle" fill={tok('muted')}>{ir}</T>
      <Box x={x + 4} y={74} w={84} h={34} fill={ok ? tok(c, 0.14) : tok('panel')} stroke={ok ? tok(c) : tok('line')}>
        <T x={x + 46} y={86} size={11} anchor="middle" fill={tok('muted')}>object</T>
        <T x={x + 46} y={100} size={12} mono anchor="middle">{obj}</T>
      </Box>
      <Box x={x + 96} y={74} w={84} h={34} fill={ok ? tok('panel') : tok(c, 0.14)} stroke={ok ? tok('line') : tok(c)}>
        <T x={x + 138} y={86} size={11} anchor="middle" fill={tok('muted')}>value</T>
        <T x={x + 138} y={100} size={12} mono anchor="middle">{val}</T>
      </Box>
      {ok ? (
        <>
          <Arrow x1={x + 46} y1={110} x2={x + 46} y2={140} color={tok(c)} />
          <T x={x + 46} y={156} size={12} mono anchor="middle">ps.x[i] = 5</T>
          <T x={x + 92} y={182} size={11} anchor="middle" fill={tok(c)}>rewritten as a column write</T>
        </>
      ) : (
        <>
          <Arrow x1={x + 138} y1={110} x2={x + 138} y2={140} color={tok(c)} />
          <T x={x + 138} y={156} size={12} mono anchor="middle">box keeps it</T>
          <T x={x + 92} y={182} size={11} anchor="middle" fill={tok(c)}>a second name: an escape</T>
        </>
      )}
    </g>
  );
}

export default function OperandPic() {
  return (
    <Svg w={400} h={196} title="Left: ps[i].x = 5, where the element is the object operand of field.set, which is safe. Right: box.last = ps[i], where the element is the value operand, which escapes.">
      <Side x={4} title="SAFE" code="ps[i].x = 5" ir="field.set %el, %5 .x" obj="%el" val="5" ok />
      <Side x={208} title="ESCAPES" code="box.last = ps[i]" ir="field.set %box, %el" obj="%box" val="%el" ok={false} />
    </Svg>
  );
}
