import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 372: one call to @viscosity/wasm's compile(source), following
// the glue that wasm-bindgen 0.2.106 generated (book/src/vendor/viscosity_wasm.js) for engine/rust/crates/wasm
// (passStringToWasm0, wasm.compile returning [ptr, errIdx, isErr],
// Output.__wrap, the code getter, free). Addresses are illustrative.
const CODE = `const r = compile(source);
console.log(r.code);
r.free();`;

type Show = { str?: boolean; bytes?: boolean; rust?: boolean; out?: boolean; obj?: boolean; copy?: boolean; freed?: boolean };
type S = { line: number; show: Show; wire?: string; note: string };

const STATES: S[] = [
  { line: 0, show: { str: true }, note: 'source is a JavaScript string, UTF-16, in the JS heap. A WebAssembly function can take only numbers, so it can’t be passed as it is.' },
  { line: 0, show: { str: true, bytes: true }, wire: 'malloc(n), TextEncoder', note: 'The glue calls the module’s own allocator to reserve bytes in linear memory, and TextEncoder writes the string there as UTF-8.' },
  { line: 0, show: { str: true, bytes: true, rust: true }, wire: 'compile(ptr, len)', note: 'Now the call is just two numbers: where the bytes start and how many. On the Rust side they are a &str, and the whole compiler runs.' },
  { line: 0, show: { str: true, bytes: true, rust: true, out: true }, wire: '← [ptr, 0, 0]', note: 'Rust returns Ok(Output). The Output struct stays in linear memory; JS gets three numbers back: its address, an error slot, and “was it an error?”.' },
  { line: 0, show: { str: true, out: true, obj: true }, note: 'Output.__wrap(ptr) makes a JS object holding only that address, in __wbg_ptr. It is a handle into Rust’s memory, like the handles of Typed indices.' },
  { line: 1, show: { str: true, out: true, obj: true, copy: true }, wire: '← code bytes, TextDecoder', note: 'Reading r.code calls a getter in Rust that clones the String; the glue decodes those bytes into a new JS string and frees the clone. Every read copies.' },
  { line: 2, show: { str: true, obj: true, freed: true }, note: 'r.free() drops the Rust Output. Forget it and a FinalizationRegistry may free it some time later; JS’s collector can’t see how much memory it holds. On an Err, the glue throws an Error instead of wrapping.' },
];

export default function BoundarySteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const sh = st.show;
  return (
    <StepFrame title="A string across the boundary" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={220} title="The JavaScript heap and WebAssembly linear memory during one compile call">
        <T x={10} y={14} size={11} weight={700} fill={tok('f3')}>JavaScript heap</T>
        <T x={220} y={14} size={11} weight={700} fill={tok('f1')}>linear memory</T>
        <Box x={8} y={24} w={170} h={186} r={4} fill="transparent" stroke={tok('f3', 0.5)} />
        <Box x={218} y={24} w={174} h={186} r={4} fill="transparent" stroke={tok('f1', 0.5)} />
        {sh.str && (
          <Box x={16} y={34} w={154} h={30} r={3} fill={tok('f3', 0.15)} stroke={tok('f3')}>
            <T x={22} y={49} size={11} mono>source "const…" UTF-16</T>
          </Box>
        )}
        {sh.bytes && (
          <Box x={226} y={34} w={158} h={30} r={3} fill={tok('f1', 0.15)} stroke={tok('f1')}>
            <T x={226} y={49} size={11} mono>63 6f 6e 73 … UTF-8</T>
          </Box>
        )}
        {sh.rust && (
          <Box x={226} y={74} w={158} h={30} r={3} fill={tok('panel')} stroke={tok('brand')}>
            <T x={226} y={89} size={11} mono>&amp;str → compile(…)</T>
          </Box>
        )}
        {sh.out && (
          <Box x={226} y={116} w={158} h={44} r={3} fill={tok('f2', 0.15)} stroke={tok('f2')}>
            <T x={234} y={130} size={11} mono>Output {'{'}</T>
            <T x={242} y={148} size={11} mono>code, explain: String {'}'}</T>
          </Box>
        )}
        {sh.freed && (
          <Box x={226} y={116} w={158} h={44} r={3} dash fill="transparent" stroke={tok('muted')}>
            <T x={305} y={138} size={11} mono anchor="middle" fill={tok('muted')}>(freed)</T>
          </Box>
        )}
        {sh.obj && (
          <Box x={16} y={116} w={154} h={44} r={3} fill={tok('f2', 0.12)} stroke={tok('f2')}>
            <T x={24} y={130} size={11} mono>r: Output</T>
            <T x={32} y={148} size={11} mono>__wbg_ptr: {sh.freed ? '0' : 'address'}</T>
          </Box>
        )}
        {sh.obj && !sh.freed && <Arrow x1={170} y1={146} x2={224} y2={140} color={tok('f2')} />}
        {sh.copy && (
          <Box x={16} y={166} w={154} h={26} r={3} fill={tok('f3', 0.15)} stroke={tok('f3')}>
            <T x={24} y={179} size={11} mono>r.code: new JS string</T>
          </Box>
        )}
        {st.wire && (
          <g>
            <Box x={100} y={196} w={200} h={20} r={3} fill={tok('paper')} stroke={tok('line')}>
              <T x={200} y={206} size={11} mono anchor="middle">{st.wire}</T>
            </Box>
          </g>
        )}
      </Svg>
    </StepFrame>
  );
}
