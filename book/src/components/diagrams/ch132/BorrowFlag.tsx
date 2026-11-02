import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 132-b: a RefCell's borrow state, checked on every borrow() and
// borrow_mut() while the program runs. The program is the chapter's; on
// rustc 1.97 it prints "2 2" and "[1, 2, 3]", then panics with
// "RefCell already mutably borrowed".
const CODE = `let c = RefCell::new(vec![1, 2]);
let r1 = c.borrow();
let r2 = c.borrow();
drop(r1);
drop(r2);
c.borrow_mut().push(3);
let w = c.borrow_mut();
let r = c.borrow(); // panics`;

type S = { line: number; readers: number; writer: boolean; vec: string; panic?: boolean; note: string };

const STATES: S[] = [
  { line: 0, readers: 0, writer: false, vec: '[1, 2]', note: 'A RefCell holds the value and a small borrow counter next to it. Nobody is borrowing yet.' },
  { line: 1, readers: 1, writer: false, vec: '[1, 2]', note: 'borrow() checks the counter: no writer, so a reader is allowed. It returns a guard (a Ref) and counts one reader.' },
  { line: 2, readers: 2, writer: false, vec: '[1, 2]', note: 'A second reader is fine too: many readers at once, exactly the rule from Borrowing.' },
  { line: 4, readers: 0, writer: false, vec: '[1, 2]', note: 'Dropping a guard gives its borrow back. With both dropped, the count is zero again.' },
  { line: 5, readers: 0, writer: false, vec: '[1, 2, 3]', note: 'borrow_mut() checks: no readers, no writer, so it hands out a writer guard; push runs, and the guard is dropped at the end of the statement.' },
  { line: 6, readers: 0, writer: true, vec: '[1, 2, 3]', note: 'This time the writer guard is kept in w, so the cell stays mutably borrowed.' },
  { line: 7, readers: 0, writer: true, vec: '[1, 2, 3]', panic: true, note: 'borrow() finds a writer still active. A plain reference would be a compile error here; a RefCell can only find out now, so it panics: RefCell already mutably borrowed.' },
];

export default function BorrowFlag() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="A RefCell checks every borrow" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={120} title="A RefCell: its value, and a counter of readers and whether a writer is active">
        <Box x={8} y={10} w={384} h={78} fill={tok('panel')} stroke={st.panic ? tok('danger') : tok('ink', 0.5)}>
          <T x={20} y={28} size={11} weight={700} fill={tok('muted')}>RefCell</T>
          <T x={20} y={52} size={12} mono>readers: {st.readers}</T>
          <T x={20} y={74} size={12} mono fill={st.writer ? tok('warn') : undefined}>writer: {st.writer ? 'yes' : 'no'}</T>
          <Box x={200} y={36} w={180} h={42} fill={tok('accent', 0.1)} stroke={tok('accent')}>
            <T x={290} y={57} size={13} mono anchor="middle">{st.vec}</T>
          </Box>
        </Box>
        {st.panic && <T x={200} y={108} size={12} mono anchor="middle" weight={700} fill={tok('danger')}>panicked: RefCell already mutably borrowed</T>}
      </Svg>
    </StepFrame>
  );
}
