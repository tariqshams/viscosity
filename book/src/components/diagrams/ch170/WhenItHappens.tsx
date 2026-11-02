import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 170: where the layout change happens. Ahead of time (Viscosity,
// a source-to-source compiler) versus at run time, inside the engine
// (the columnar-array research, makor2022).
export default function WhenItHappens() {
  return (
    <Svg w={400} h={250} title="Two places a layout change can happen: before the program runs, or inside the engine while it runs">
      <T x={8} y={14} size={12} weight={700} fill={tok('brand')}>AHEAD OF TIME (Viscosity)</T>
      <Box x={8} y={28} w={84} h={40}><T x={50} y={48} size={11} anchor="middle">app.js</T></Box>
      <Arrow x1={92} y1={48} x2={118} y2={48} />
      <Box x={118} y={28} w={100} h={40} fill={tok('brand', 0.12)} stroke={tok('brand')}><T x={168} y={48} size={11} anchor="middle">viscosity</T></Box>
      <Arrow x1={218} y1={48} x2={244} y2={48} />
      <Box x={244} y={28} w={70} h={40}><T x={279} y={48} size={11} anchor="middle">out.js</T></Box>
      <Arrow x1={314} y1={48} x2={334} y2={48} />
      <Box x={334} y={28} w={60} h={40}><T x={364} y={48} size={11} anchor="middle">any engine</T></Box>
      <T x={8} y={86} size={11} fill={tok('muted')}>Decides once, from the code alone. Output is readable JS.</T>

      <T x={8} y={130} size={12} weight={700} fill={tok('f3')}>AT RUN TIME (inside the engine)</T>
      <Box x={8} y={144} w={84} h={40}><T x={50} y={164} size={11} anchor="middle">app.js</T></Box>
      <Arrow x1={92} y1={164} x2={118} y2={164} />
      <Box x={118} y={144} w={276} h={72} fill={tok('f3', 0.12)} stroke={tok('f3')}>
        <T x={256} y={162} size={11} anchor="middle">a modified engine</T>
        <T x={256} y={182} size={10} anchor="middle" fill={tok('muted')}>watches the running program,</T>
        <T x={256} y={198} size={10} anchor="middle" fill={tok('muted')}>converts arrays it sees are suitable</T>
      </Box>
      <T x={8} y={236} size={11} fill={tok('muted')}>Sees real values, but only that engine benefits.</T>
    </Svg>
  );
}
