import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 290: the Lend borrow checker walking a program one line at a
// time, keeping its ledger of moved names and loans (which, in this
// first version, never end).
const CODE = `let v = new
let s = new
let a = &v
let b = &v
let m = &mut v
let t = s
use s
s = new
use s`;

type Loan = { name: string; k: '&' | '&mut'; of: string };
type S = { line: number | null; moved: string[]; loans: Loan[]; verdict: string; bad?: boolean; note: string };

const L1: Loan = { name: 'a', k: '&', of: 'v' };
const L2: Loan = { name: 'b', k: '&', of: 'v' };

const STATES: S[] = [
  { line: null, moved: [], loans: [], verdict: 'start', note: 'The checker reads the program top to bottom, once, without running it. Its whole memory is the ledger below: which names have been moved away, and which loans are out.' },
  { line: 0, moved: [], loans: [], verdict: 'ok', note: 'let v = new: v owns a fresh value. Nothing is borrowed or moved, so there is nothing to check.' },
  { line: 1, moved: [], loans: [], verdict: 'ok', note: 'let s = new: a second owner, s. The ledger is still empty.' },
  { line: 2, moved: [], loans: [L1], verdict: 'ok', note: 'let a = &v is a read of v. No loan of v is out, so it is legal, and the checker writes down a new shared loan: a borrows v.' },
  { line: 3, moved: [], loans: [L1, L2], verdict: 'ok', note: 'let b = &v is another read. The only loan of v is shared, and a read next to a shared loan is fine: any number of readers may share.' },
  { line: 4, moved: [], loans: [L1, L2], verdict: 'E0502', bad: true, note: 'let m = &mut v wants to change v, but two shared loans of v are out. A writer next to a reader is the one thing the rules forbid: error E0502, and no loan is recorded.' },
  { line: 5, moved: ['s'], loans: [L1, L2], verdict: 'ok', note: 'let t = s moves the value: t is its owner now. Nothing borrows s, so the move is legal, and s goes into the moved set.' },
  { line: 6, moved: ['s'], loans: [L1, L2], verdict: 'E0382', bad: true, note: 'use s reads a name whose value has gone to t. Error E0382, "borrow of moved value".' },
  { line: 7, moved: [], loans: [L1, L2], verdict: 'ok', note: 's = new gives s a fresh value, so s leaves the moved set. Assigning would be E0506 if s were borrowed, but it is not.' },
  { line: 8, moved: [], loans: [L1, L2], verdict: 'ok', note: 'use s is fine again. Two errors in all, found without running a single line.' },
];

export default function LoanSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="The borrow checker's ledger, line by line" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={120} title="The ledger: the moved set, the loans that are out, and the verdict for the current line">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>LOANS OUT</T>
        {st.loans.length === 0 && <Box x={8} y={22} w={170} h={26} dash />}
        {st.loans.map((l, k) => (
          <Box key={l.name} x={8} y={22 + k * 32} w={170} h={26} fill={tok('f2', 0.12)} stroke={tok('f2')}>
            <T x={18} y={35 + k * 32} size={12} mono>{`${l.name} = ${l.k}${l.k === '&mut' ? ' ' : ''}${l.of}`}</T>
            <T x={170} y={35 + k * 32} size={11} anchor="end" fill={tok('muted')}>{l.k === '&' ? 'shared' : 'mutable'}</T>
          </Box>
        ))}
        <T x={200} y={12} size={11} weight={700} fill={tok('muted')}>MOVED</T>
        <Box x={200} y={22} w={80} h={26} dash={!st.moved.length}>
          <T x={240} y={35} size={12} mono anchor="middle">{st.moved.join(', ')}</T>
        </Box>
        <T x={300} y={12} size={11} weight={700} fill={tok('muted')}>THIS LINE</T>
        <Box x={300} y={22} w={92} h={26} fill={st.bad ? tok('danger', 0.12) : tok('safe', 0.12)} stroke={st.bad ? tok('danger') : tok('safe')}>
          <T x={346} y={35} size={12} mono anchor="middle">{st.verdict}</T>
        </Box>
        <T x={200} y={100} size={11} fill={tok('muted')}>Loans never end in this</T>
        <T x={200} y={114} size={11} fill={tok('muted')}>first version.</T>
      </Svg>
    </StepFrame>
  );
}
