import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// A real deoptimisation of run(), read off  node --trace-deopt-verbose
// (Node v22.23.4, V8 12.4), trimmed. The loop builds
//   const p = { x: xs[i], y: ys[i] }; const q = p;
// and escape analysis had removed p; the deopt happened at i = 1, where
// xs[1] = ys[1] = 1. The two "Materialization" lines gave both slots the
// same address.
const LINES = [
  'reading input frame run => bytecode_offset=59',
  '  5: 1 ; rcx                  (i)',
  '  6: captured object #0 (length = 5)',
  '       <Map[40](HOLEY_ELEMENTS)>',
  '       <FixedArray[0]>  <FixedArray[0]>',
  '       captured object #1 (length = 2)',
  '         <Map(HEAP_NUMBER_TYPE)> 1.0 ; xmm0',
  '       captured object #2 (length = 2)',
  '         <Map(HEAP_NUMBER_TYPE)> 1.0 ; xmm1',
  '  7: duplicated object #0',
  'Materialization [..c88] <- 0x..cd59 <Object>',
  'Materialization [..c90] <- 0x..cd59 <Object>',
];

type S = { hi: number[]; note: string };
const STATES: S[] = [
  { hi: [0], note: 'A guard failed in run, and the deoptimiser starts rebuilding the interpreter frame for bytecode offset 59. Each numbered input is one value the interpreter frame needs, read from wherever the optimised code kept it.' },
  { hi: [1], note: 'Input 5 is the loop counter i, which lived in the register rcx: it is 1, so the guard failed on the second trip.' },
  { hi: [2, 3, 4], note: 'Input 6 is p, but p was never allocated: it is a captured object, a description with five entries. The first three are the header of a real object: its map, then empty property and element stores.' },
  { hi: [5, 6, 7, 8], note: 'The last two entries are the fields x and y. Each is itself a captured object, a HeapNumber to be made from a double that sat in an xmm register: the optimised code held the fields as raw doubles, and the rebuilt object needs heap values.' },
  { hi: [9], note: 'Input 7 is q, and the trace does not describe it again: "duplicated object #0" says it is the same object as input 6. Rebuilding it twice would give p !== q, which the program could notice.' },
  { hi: [10, 11], note: 'Finally the deoptimiser allocates the object for real and writes its address into both register slots: the same address, 0x..cd59, twice. The interpreter resumes with one object, seen through two names, as if it had always existed.' },
];

export default function RebuildSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="A removed object, rebuilt by the deoptimiser" steps={s} note={st.note}>
      <Svg w={400} h={LINES.length * 22 + 16} title="A trimmed --trace-deopt-verbose listing, one line per row; the lines the current step explains are highlighted in orange.">
        {LINES.map((l, k) => {
          const on = st.hi.includes(k);
          return (
            <Box key={k} x={4} y={6 + k * 22} w={392} h={20} r={3} fill={on ? tok('brand', 0.16) : tok('panel')} stroke={on ? tok('brand') : tok('line')}>
              <T x={10} y={16 + k * 22} size={10} mono fill={on ? tok('brand') : tok('ink')}>{l}</T>
            </Box>
          );
        })}
      </Svg>
    </StepFrame>
  );
}
