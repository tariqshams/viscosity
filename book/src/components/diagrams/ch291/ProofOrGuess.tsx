import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 291: the two ways to change a layout. Viscosity decides before
// the program runs, so it must prove the change is invisible; a run-time
// system (the GraalJS research summarised in this chapter) decides while
// it runs, so it can guess, guard the guess, and fall back.
export default function ProofOrGuess() {
  const lane = (y: number, label: string, color: string) => (
    <T x={6} y={y} size={11} weight={700} fill={tok(color)}>{label}</T>
  );
  return (
    <Svg w={400} h={262} title="Two lanes. Ahead of time: read the source, prove the rewrite safe for every possible run, rewrite, then ship and run, with no way back. At run time: run the program, watch the real arrays, guess a layout, and guard every use with a check, falling back to the old layout through deoptimisation if the guess is wrong.">
      {lane(12, 'AHEAD OF TIME (Viscosity)', 'brand')}
      {[['read source', 6], ['prove it safe', 104], ['rewrite', 202], ['ship, run', 300]].map(([t, x], k) => (
        <Box key={k} x={x as number} y={22} w={90} h={40} fill={tok('brand', 0.12)} stroke={tok('brand')}>
          <T x={(x as number) + 45} y={k === 1 ? 35 : 42} size={12} anchor="middle">{t}</T>
          {k === 1 && <T x={(x as number) + 45} y={53} size={12} anchor="middle">for every run</T>}
        </Box>
      ))}
      <Arrow x1={96} y1={42} x2={104} y2={42} />
      <Arrow x1={194} y1={42} x2={202} y2={42} />
      <Arrow x1={292} y1={42} x2={300} y2={42} />
      <T x={200} y={80} size={11} anchor="middle" fill={tok('muted')}>no proof, no change; once shipped, no way back</T>

      {lane(108, 'AT RUN TIME (a speculating engine)', 'f3')}
      {[['run, watch', 6], ['guess layout', 104], ['guard uses', 202]].map(([t, x], k) => (
        <Box key={k} x={x as number} y={118} w={90} h={40} fill={tok('f3', 0.12)} stroke={tok('f3')}>
          <T x={(x as number) + 45} y={138} size={12} anchor="middle">{t}</T>
        </Box>
      ))}
      <Arrow x1={96} y1={138} x2={104} y2={138} />
      <Arrow x1={194} y1={138} x2={202} y2={138} />
      <Arrow x1={292} y1={130} x2={312} y2={116} />
      <Arrow x1={292} y1={146} x2={312} y2={174} />
      <Box x={314} y={100} w={80} h={30} fill={tok('safe', 0.15)} stroke={tok('safe')}>
        <T x={354} y={115} size={12} anchor="middle">fast path</T>
      </Box>
      <Box x={314} y={160} w={80} h={30} fill={tok('f6', 0.15)} stroke={tok('f6')}>
        <T x={354} y={175} size={12} anchor="middle">deoptimise</T>
      </Box>
      <Arrow x1={330} y1={190} x2={60} y2={160} bend={-0.5} dash color={tok('f6')} />
      <T x={200} y={222} size={11} anchor="middle" fill={tok('muted')}>wrong guesses are recovered from, at a cost</T>
      <T x={200} y={244} size={11} anchor="middle" fill={tok('ink')} weight={700}>open: an ahead-of-time tool with a cheap way back</T>
    </Svg>
  );
}
