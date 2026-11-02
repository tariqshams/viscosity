// Chapter 391: the plan for drip-rs, as a map from the TypeScript VM's
// files (book/companion/ts/src/vm) to the Rust modules
// (book/companion/rust/src), following the module map in drip-rs's
// README. Each step lights the rows a design decision touches and says
// what the ownership rules forced. Nothing here is invented: every
// pairing and every change is in the README or the source files.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const ROWS = [
  { ts: 'scanner.ts', rs: 'scanner.rs' },
  { ts: 'compiler.ts', rs: 'compiler.rs' },
  { ts: 'chunk.ts', rs: 'chunk.rs' },
  { ts: 'object.ts', rs: 'value.rs + object.rs' },
  { ts: 'table.ts', rs: 'table.rs' },
  { ts: 'heap.ts', rs: 'gc.rs' },
  { ts: 'vm.ts', rs: 'vm.rs' },
  { ts: 'debug.ts', rs: 'debug.rs' },
] as const;

type S = { hi: number[]; tag?: string; roots?: boolean; corpus?: boolean; note: string };

const STATES: S[] = [
  { hi: [], note: 'Eight TypeScript files on the left, their Rust twins on the right, in pipeline order: source text goes in at the top, output comes out of the VM. The port keeps this shape, so every chapter of Part XII has one TypeScript file to compare against.' },
  { hi: [0], tag: 'tokens borrow the source', note: 'The scanner barely changes. A token’s text becomes a &str slice of the source instead of a copied string, so scanning allocates nothing (the chapters Tokens as enums and The scanner in Rust).' },
  { hi: [2], tag: 'enum OpCode, Vec<u8>', note: 'The Op table of numbers becomes a #[repr(u8)] enum with the same 53 instructions, and code becomes a real Vec<u8> instead of an array of JavaScript numbers (the chapter Bytecode and instructions in Rust).' },
  { hi: [3, 5], tag: 'arenas + Gc<T> handles', note: 'The big change. In TypeScript, objects point at each other freely. In drip-rs, each kind of object lives in its own arena, and a reference is a Gc<T>: a typed u32 index. Only the heap owns objects.' },
  { hi: [5, 6], tag: 'roots passed in', roots: true, note: 'The TypeScript heap collects inside allocate() and finds the VM through heap.vm. A Rust heap can’t keep a reference to the VM that owns it, so the VM asks should_collect() and passes its roots to collect().' },
  { hi: [1, 6], tag: 'Rc<Chunk>, the only Rc', note: 'Once compiled, a chunk never changes. drip-rs freezes it in an Rc<Chunk>, so the VM can hold the running chunk itself while it mutates the heap. This is the only Rc in the crate.' },
  { hi: [0, 1, 2, 3, 4, 5, 6, 7], corpus: true, note: 'Both VMs run the same 344 corpus programs and must agree byte for byte: output, error messages, stack traces and exit codes. The disassembler’s listings match too.' },
];

export default function PortSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const y0 = 34;
  const rh = 25;
  return (
    <StepFrame title="From the TypeScript VM to drip-rs" steps={s} note={st.note}>
      <Svg w={400} h={300} title="A table pairing each TypeScript VM file with its Rust module">
        <T x={20} y={16} size={11} weight={700} fill={tok('accent')}>TypeScript (Part IV)</T>
        <T x={230} y={16} size={11} weight={700} fill={tok('brand')}>Rust (Part XII)</T>
        {ROWS.map((r, k) => {
          const y = y0 + k * rh;
          const on = st.hi.includes(k);
          return (
            <g key={r.ts}>
              <Box x={10} y={y} w={140} h={20} r={3} fill={on ? tok('accent', 0.15) : tok('panel')} stroke={on ? tok('accent') : tok('line')}>
                <T x={20} y={y + 10} size={11} mono>{r.ts}</T>
              </Box>
              <Arrow x1={152} y1={y + 10} x2={216} y2={y + 10} color={on ? tok('brand') : tok('ink', 0.25)} width={on ? 2 : 1.2} />
              <Box x={220} y={y} w={170} h={20} r={3} fill={on ? tok('brand', 0.18) : tok('panel')} stroke={on ? tok('brand') : tok('line')}>
                <T x={230} y={y + 10} size={11} mono>{r.rs}</T>
              </Box>
            </g>
          );
        })}
        {st.roots && (
          <g>
            <T x={390} y={y0 + 8 * rh + 4} size={11} mono anchor="end" fill={tok('safe')}>vm.rs → gc.rs: collect(&amp;[&amp;roots])</T>
          </g>
        )}
        {st.tag && !st.roots && (
          <T x={220} y={y0 + 8 * rh + 2} size={11} mono fill={tok('brand')}>{st.tag}</T>
        )}
        {st.corpus && (
          <Box x={10} y={y0 + 8 * rh + 12} w={380} h={30} r={4} fill={tok('safe', 0.12)} stroke={tok('safe')}>
            <T x={200} y={y0 + 8 * rh + 27} size={11} anchor="middle">same 344 programs · same bytes out</T>
          </Box>
        )}
      </Svg>
    </StepFrame>
  );
}
