// Chapter 138: an error token in each VM, for the source `print x @`
// on line 2. TypeScript (book/companion/ts/src/vm/scanner.ts) returns
// { type: 'error', lexeme: <the message>, line }. drip-rs
// (book/companion/rust/src/scanner.rs) returns a Token whose kind is
// Error(ScanError::UnexpectedCharacter) and whose lexeme is the "@"
// itself; Compiler::advance (compiler.rs) calls error.message(lexeme)
// to build the same text. The Rust token's Debug form was printed by
// running the real scanner with rustc 1.97.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

export default function ErrorTokens() {
  return (
    <Svg w={400} h={236} title="The TypeScript error token holds the message; the Rust one holds the text and a ScanError, turned into the same message later">
      <T x={8} y={14} size={11} weight={700} fill={tok('accent')}>TypeScript VM scanner</T>
      <Box x={8} y={24} w={384} h={52} r={4} fill={tok('accent', 0.08)} stroke={tok('accent')}>
        <T x={18} y={40} size={11} mono>{"{ type: 'error', line: 2,"}</T>
        <T x={18} y={60} size={11} mono>{"  lexeme: \"unexpected character '@'\" }"}</T>
      </Box>
      <T x={8} y={98} size={11} weight={700} fill={tok('brand')}>drip-rs scanner</T>
      <Box x={8} y={108} w={384} h={52} r={4} fill={tok('brand', 0.08)} stroke={tok('brand')}>
        <T x={18} y={124} size={11} mono>{'Token { kind: Error(UnexpectedCharacter),'}</T>
        <T x={18} y={144} size={11} mono>{'        lexeme: "@", line: 2 }'}</T>
      </Box>
      <Arrow x1={200} y1={162} x2={200} y2={186} color={tok('brand')} />
      <T x={210} y={174} size={11} mono fill={tok('muted')}>compiler: error.message("@")</T>
      <Box x={8} y={190} w={384} h={30} r={4} fill={tok('safe', 0.12)} stroke={tok('safe')}>
        <T x={200} y={205} size={11} mono anchor="middle">line 2: unexpected character '@'</T>
      </Box>
    </Svg>
  );
}
