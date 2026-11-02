import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 270: the 41-byte WebAssembly module from the chapter (one
// function, add), read group by group. Byte values checked against the
// WebAssembly core specification's binary format and run in Node.
type Group = { label: string; bytes: string[]; head: number };

const GROUPS: Group[] = [
  { label: 'magic', bytes: ['00', '61', '73', '6d'], head: 0 },
  { label: 'version', bytes: ['01', '00', '00', '00'], head: 0 },
  { label: 'type', bytes: ['01', '07', '01', '60', '02', '7f', '7f', '01', '7f'], head: 2 },
  { label: 'function', bytes: ['03', '02', '01', '00'], head: 2 },
  { label: 'export', bytes: ['07', '07', '01', '03', '61', '64', '64', '00', '00'], head: 2 },
  { label: 'code', bytes: ['0a', '09', '01', '07', '00', '20', '00', '20', '01', '6a', '0b'], head: 2 },
];

type State = { hi: number; meaning: string[]; stack?: string[]; note: string };

const STATES: State[] = [
  { hi: -1, meaning: ['41 bytes: a preamble, then four sections'], note: 'The whole module, every byte of it. The first 8 bytes are a preamble. After that come sections, each starting with a one-byte id and a length. Step through to read them.' },
  { hi: 0, meaning: ['00 61 73 6d = the text "\\0asm"'], note: 'The magic number: a zero byte, then the ASCII codes of a, s and m. An engine checks these four bytes first, so it can reject a file that isn’t WebAssembly at all.' },
  { hi: 1, meaning: ['01 00 00 00 = version 1'], note: 'The binary format version, 1, as a 4-byte number with its smallest byte first (little-endian). It has stayed 1 while features were added: the format is meant to grow without a new version.' },
  { hi: 2, meaning: ['id 1 (type), 7 bytes follow', '1 type: 60 = function type', '2 params i32 i32 (7f 7f), 1 result i32'], note: 'Section id 1, the type section, says 7 bytes of contents follow. Inside: a list of one function type. 0x60 marks a function type, then the parameter list (2 × i32, which is 0x7f) and the result list (1 × i32).' },
  { hi: 3, meaning: ['id 3 (function), 2 bytes follow', '1 function, using type 0'], note: 'The function section only declares functions, by type: “there is one function, and it has type 0”. Its body comes later, in the code section.' },
  { hi: 4, meaning: ['id 7 (export), 7 bytes follow', '1 export: name of length 3, "add"', 'kind 00 (a function), index 0'], note: 'The export section names what JavaScript can see. 61 64 64 are the ASCII codes for “add”. Kind 0 means a function, and index 0 is the function declared above.' },
  { hi: 5, meaning: ['id 10 (code), 9 bytes follow', '1 body of 7 bytes, 0 locals', '20 00 · 20 01 · 6a · 0b'], stack: [], note: 'The code section holds the body: no extra locals (00), then four instructions. 0x20 is local.get, 0x6a is i32.add and 0x0b is end. This is bytecode, like Drip’s, for a stack machine.' },
  { hi: 5, meaning: ['local.get 0 → push a'], stack: ['2'], note: 'Calling add(2, 3) runs the body. local.get 0 pushes the first parameter onto the operand stack.' },
  { hi: 5, meaning: ['local.get 1 → push b'], stack: ['2', '3'], note: 'local.get 1 pushes the second parameter. Two values are on the stack now.' },
  { hi: 5, meaning: ['i32.add → pop two, push the sum', 'end → the top of the stack is the result'], stack: ['5'], note: 'i32.add pops both and pushes 5. At end, the value left on the stack is the function’s result, and JavaScript receives the number 5.' },
];

export default function ModuleBytes() {
  const s = useSteps(STATES);
  const st = s.state;
  const rowH = 30;
  const top = 10;
  const mY = top + GROUPS.length * rowH + 10;
  return (
    <StepFrame title="Reading a WebAssembly module" steps={s} note={st.note}>
      <Svg w={400} h={mY + 112} title="The bytes of a WebAssembly module that exports add, grouped into the preamble and four sections, with one group highlighted at a time">
        {GROUPS.map((g, k) => {
          const y = top + k * rowH;
          const on = k === st.hi;
          return (
            <g key={g.label} opacity={st.hi < 0 || on ? 1 : 0.35}>
              <T x={4} y={y + 12} size={11} weight={700} fill={on ? tok('brand') : tok('muted')}>{g.label}</T>
              {g.bytes.map((b, j) => {
                const head = j < g.head;
                return (
                  <Box key={j} x={70 + j * 29} y={y} w={26} h={24} r={3}
                    fill={on ? (head ? tok('accent', 0.2) : tok('brand', 0.15)) : tok('panel')}
                    stroke={on ? (head ? tok('accent') : tok('brand')) : tok('line')}>
                    <T x={83 + j * 29} y={y + 12.5} size={11} mono anchor="middle">{b}</T>
                  </Box>
                );
              })}
            </g>
          );
        })}
        <Box x={4} y={mY} w={st.stack ? 270 : 392} h={98} fill={tok('panel')} stroke={tok('line')}>
          <T x={14} y={mY + 15} size={11} weight={700} fill={tok('muted')}>WHAT IT MEANS</T>
          {st.meaning.map((m, j) => (
            <T key={j} x={14} y={mY + 36 + j * 20} size={12} mono={j > 0 || st.hi >= 0}>{m}</T>
          ))}
        </Box>
        {st.stack && (
          <g>
            <T x={336} y={mY + 15} size={11} weight={700} anchor="middle" fill={tok('muted')}>STACK</T>
            <rect x={300} y={mY + 24} width={72} height={74} fill="none" stroke={tok('ink', 0.5)} />
            {st.stack.map((v, j) => (
              <Box key={j} x={306} y={mY + 72 - j * 24} w={60} h={20} r={3} fill={tok('safe', 0.2)} stroke={tok('safe')}>
                <T x={336} y={mY + 82 - j * 24} size={12} mono anchor="middle">{v}</T>
              </Box>
            ))}
          </g>
        )}
      </Svg>
    </StepFrame>
  );
}
