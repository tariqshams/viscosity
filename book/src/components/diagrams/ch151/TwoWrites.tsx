// Chapter 151: Rust's two Write traits. std::fmt::Write takes UTF-8 text
// (required method write_str) and is implemented by String (and
// fmt::Formatter); std::io::Write takes bytes (required methods write and
// flush) and is implemented by File, Stdout, Vec<u8> and others. write! and
// writeln! work with either: they call the writer's write_fmt.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

export default function TwoWrites() {
  return (
    <Svg w={400} h={226} title="write! calls write_fmt, which comes from std::fmt::Write for text writers such as String, or from std::io::Write for byte writers such as files">
      <Box x={120} y={8} w={160} h={36} fill={tok('brand', 0.14)} stroke={tok('brand')}>
        <T x={200} y={26} size={12} mono anchor="middle" weight={700}>write!(w, ...)</T>
      </Box>
      <T x={200} y={58} size={11} mono anchor="middle" fill={tok('muted')}>calls w.write_fmt(...)</T>
      <Arrow x1={170} y1={66} x2={100} y2={92} />
      <Arrow x1={230} y1={66} x2={300} y2={92} />
      <Box x={8} y={94} w={184} h={78} fill={tok('safe', 0.12)} stroke={tok('safe')}>
        <T x={100} y={112} size={12} mono anchor="middle" weight={700}>std::fmt::Write</T>
        <T x={100} y={132} size={11} anchor="middle">text (UTF-8)</T>
        <T x={100} y={152} size={11} mono anchor="middle">String, Formatter</T>
      </Box>
      <Box x={208} y={94} w={184} h={78} fill={tok('accent', 0.12)} stroke={tok('accent')}>
        <T x={300} y={112} size={12} mono anchor="middle" weight={700}>std::io::Write</T>
        <T x={300} y={132} size={11} anchor="middle">bytes</T>
        <T x={300} y={152} size={11} mono anchor="middle">File, Stdout, Vec&lt;u8&gt;</T>
      </Box>
      <T x={100} y={192} size={11} anchor="middle" fill={tok('safe')}>what format! builds</T>
      <T x={300} y={192} size={11} anchor="middle" fill={tok('accent')}>the CLI's stdout</T>
      <T x={200} y={214} size={11} anchor="middle" fill={tok('muted')}>either way, the trait must be in scope (use ...)</T>
    </Svg>
  );
}
