import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';
import rs from '../../../../companion/rust/results/drip-rs-bench-2026-11-02.json';

// Chapter 147: the ledger of the port, one line at a time. The speed-ups
// are read from companion/rust/results/drip-rs-bench-2026-11-02.json.
// The other facts were checked against book/companion/rust on
// 2026-11-02: 53 OpCode variants and 53 arms in Vm::run's match; nine
// arenas in gc.rs's Heap; #![forbid(unsafe_code)] in lib.rs; Cargo.lock
// lists only drip-rs itself; the release binary is 593,688 bytes; a
// release build took 7.4 s; code lines 3,328 against the TypeScript VM's
// 1,714 (see LocBars.tsx for how they were counted); seven unreachable!
// calls in vm.rs and compiler.rs; one .clone() of a Table (Inherit).
type Row = { side: 'gain' | 'cost'; head: string; sub: string };
type Row2 = { program: string; speedupVsTsVm: number };

const ratios = (rs.rows as Row2[]).map((r) => r.speedupVsTsVm);
const geo = Math.exp(ratios.reduce((a, x) => a + Math.log(x), 0) / ratios.length);

const ROWS: Row[] = [
  { side: 'gain', head: `${geo.toFixed(2)}× the TS VM`, sub: `${Math.min(...ratios)}–${Math.max(...ratios)}×, 10 programs` },
  { side: 'cost', head: '1.94× the lines', sub: '3,328 against 1,714' },
  { side: 'gain', head: 'checked at compile time', sub: '53 opcode arms, typed Gc<T>' },
  { side: 'cost', head: 'designs it forced', sub: 'arenas, roots passed in' },
  { side: 'gain', head: 'no unsafe, no deps', sub: 'forbid(unsafe_code)' },
  { side: 'cost', head: 'a build step', sub: '7.5 s release build' },
  { side: 'gain', head: 'one small binary', sub: '594 KB, no runtime' },
  { side: 'cost', head: 'bugs it cannot see', sub: 'a forgotten root' },
];

const NOTES = [
  'A ledger: what the port to Rust gained on the left, what it cost on the right, one line at a time.',
  'Speed first, from the committed results file: the geometric mean over the ten benchmark programs against the TypeScript VM.',
  'The price in code: nearly twice the lines, counted without blanks, comments or unit tests.',
  'The compiler checks every match on OpCode for a missing arm, and a Gc<ObjClass> cannot be passed where a Gc<ObjInstance> is wanted.',
  'Some designs exist only because of the borrowing rules: objects in nine arenas with handles, and the roots handed to the collector.',
  'lib.rs forbids unsafe code, every index is checked, and Cargo.lock lists no crate but drip-rs itself.',
  'The TypeScript VM runs straight from source with Node; drip-rs must be compiled first, about 7.5 seconds for a release build here.',
  'The result is one 594 KB executable that needs nothing installed to run.',
  'And Rust cannot see a logic bug in safe code: a root the VM forgets to pass in. Only the stress tests catch that.',
];

const STATES = NOTES.map((note, i) => ({ upTo: i, note }));

export default function LedgerSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const shown = ROWS.slice(0, st.upTo);
  const gains = shown.filter((r) => r.side === 'gain');
  const costs = shown.filter((r) => r.side === 'cost');
  const col = (rows: Row[], x: number, c: string) =>
    rows.map((r, i) => {
      const y = 34 + i * 52;
      const fresh = r === shown[shown.length - 1];
      return (
        <Box key={r.head} x={x} y={y} w={190} h={44} r={5} fill={tok(c, fresh ? 0.22 : 0.1)} stroke={tok(c)}>
          <T x={x + 8} y={y + 15} size={12} weight={700}>{r.head}</T>
          <T x={x + 8} y={y + 32} size={11} mono fill={tok('muted')}>{r.sub}</T>
        </Box>
      );
    });
  return (
    <StepFrame title="The ledger of the port" steps={s} note={st.note}>
      <Svg w={400} h={246} title="What porting the Drip VM to Rust gained and what it cost">
        <T x={99} y={14} size={12} weight={700} anchor="middle" fill={tok('safe')}>gained</T>
        <T x={301} y={14} size={12} weight={700} anchor="middle" fill={tok('danger')}>cost</T>
        <line x1={200} x2={200} y1={24} y2={242} stroke={tok('line')} />
        {col(gains, 4, 'safe')}
        {col(costs, 206, 'danger')}
      </Svg>
    </StepFrame>
  );
}
