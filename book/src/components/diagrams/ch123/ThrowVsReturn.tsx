import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Left: the TypeScript VM throws; the exception skips every frame between
// the throw and the catch, and nothing in their types mentions it.
// Right: drip-rs returns Err; each frame passes it on with ?, one return
// at a time, and each signature says Result.

const TS = ['interpret (catch)', 'run', 'numbers', 'runtimeError (throw)'];
const RS = ['interpret: match', 'run: pop_numbers()?', 'pop_numbers: Err(..)', 'runtime_error'];

export default function ThrowVsReturn() {
  const fw = 172;
  const fh = 34;
  const gap = 14;
  const y0 = 30;
  return (
    <Svg w={400} h={240} title="A thrown exception jumping over frames, compared with an error returned frame by frame">
      <T x={8} y={14} size={11} weight={700} fill={tok('muted')}>TYPESCRIPT VM: THROW</T>
      <T x={212} y={14} size={11} weight={700} fill={tok('muted')}>DRIP-RS: RETURN Err</T>
      {TS.map((f, i) => {
        const y = y0 + i * (fh + gap);
        return (
          <Box key={f} x={8} y={y} w={fw} h={fh} r={4} fill={i === 0 || i === 3 ? tok('danger', 0.1) : tok('panel')} stroke={i === 0 || i === 3 ? tok('danger') : tok('line')}>
            <T x={18} y={y + fh / 2} size={11} mono>{f}</T>
          </Box>
        );
      })}
      <Arrow x1={176} y1={y0 + 3 * (fh + gap) + 6} x2={176} y2={y0 + fh - 4} color={tok('danger')} bend={-0.35} dash />
      {RS.map((f, i) => {
        const y = y0 + i * (fh + gap);
        return (
          <g key={f}>
            <Box x={212} y={y} w={fw} h={fh} r={4} fill={tok('brand', 0.08)} stroke={tok('brand')}>
              <T x={222} y={y + fh / 2} size={11} mono>{f}</T>
            </Box>
            {i > 0 && <Arrow x1={298} y1={y - 2} x2={298} y2={y - gap + 2} color={tok('brand')} />}
          </g>
        );
      })}
      <T x={8} y={222} size={11} fill={tok('muted')}>skips the frames between</T>
      <T x={212} y={222} size={11} fill={tok('muted')}>each frame returns it on</T>
    </Svg>
  );
}
