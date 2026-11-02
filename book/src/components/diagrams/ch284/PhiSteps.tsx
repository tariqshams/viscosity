import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 284: how `throw e` inside a loop gets its operand, following
// FunctionBuilder in engine/rust/crates/core/src/builder.rs (Braun et al.).
// Value numbers %14 and %21 are from a real VIR listing of
//   const e = ps[0]; for (...) { if (i === 1) throw e; }
// printed with print_func; blocks are renamed and the empty ones between
// body and latch are left out.
type Blk = 'entry' | 'head' | 'body' | 'throw' | 'latch';
type S = { hi: Blk[]; head: string; thr: string; sealed: boolean; bad?: boolean; good?: boolean; note: string };

const STATES: S[] = [
  { hi: ['throw'], head: '', thr: 'throw e', sealed: false, note: 'Lowering reaches throw e. The throw block has no definition of e, and it has one predecessor, so the builder asks body, which asks head.' },
  { hi: ['head'], head: '%21 = phi ?', thr: 'throw %21', sealed: false, note: 'head is a loop header and isn’t sealed: the back edge from latch doesn’t exist yet. So the builder makes an incomplete phi, %21, records e = %21 in head, and the throw uses %21.' },
  { hi: ['head', 'entry', 'latch'], head: '%21 = phi %14, %21', thr: 'throw %21', sealed: true, note: 'The loop is finished and head is sealed. Its operands are e read in each predecessor: %14 (ps[0]) from entry, and from latch… %21 itself, found by walking back up to head.' },
  { hi: ['head'], head: '(removed)', thr: 'throw %14', sealed: true, good: true, note: 'Apart from itself, the phi merges only %14: it is trivial. Every use of %21 is rewritten to %14: instruction operands, condbr, return, and throw. The phi becomes an opaque “removed-trivial-phi” with no operands.' },
  { hi: ['throw'], head: '(removed)', thr: 'throw %21', sealed: true, bad: true, note: 'Without the throw line (the TS bug the port found), the throw still names %21, an empty opaque. The escape analysis never sees the element reach a throw, and ps becomes SoA: the compiled program throws an index.' },
  { hi: ['throw'], head: '(removed)', thr: 'throw %14', sealed: true, good: true, note: 'With it, throw %14 is an element escaping, and ps is kept as an array of objects: “an element is returned or branched on”.' },
];

const BL: { id: Blk; x: number; y: number; code: (s: S) => string }[] = [
  { id: 'entry', x: 10, y: 10, code: () => '%14 = index.get ps, 0' },
  { id: 'head', x: 10, y: 70, code: (s) => s.head || '…' },
  { id: 'body', x: 10, y: 130, code: () => 'condbr i === 1' },
  { id: 'throw', x: 200, y: 130, code: (s) => s.thr },
  { id: 'latch', x: 200, y: 70, code: () => 'i++; br head' },
];

export default function PhiSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="A phi for throw e, and its removal" steps={s} note={st.note}>
      <Svg w={400} h={200} title="Blocks of a loop with a throw, and the phi the SSA builder makes and removes">
        <Arrow x1={95} y1={38} x2={95} y2={68} color={tok('ink', 0.35)} width={1.5} />
        <Arrow x1={95} y1={98} x2={95} y2={128} color={tok('ink', 0.35)} width={1.5} />
        <Arrow x1={182} y1={144} x2={198} y2={144} color={tok('ink', 0.35)} width={1.5} />
        <Arrow x1={182} y1={136} x2={240} y2={100} color={tok('ink', 0.35)} width={1.5} />
        <Arrow x1={200} y1={80} x2={182} y2={80} color={st.sealed ? tok('f3') : tok('ink', 0.2)} width={st.sealed ? 2 : 1.5} dash={!st.sealed} />
        {BL.map((b) => {
          const on = st.hi.includes(b.id);
          const red = st.bad && b.id === 'throw';
          const green = st.good && b.id === 'throw';
          return (
            <Box key={b.id} x={b.x} y={b.y} w={172} h={30} r={4}
              fill={red ? tok('danger', 0.15) : green ? tok('safe', 0.15) : on ? tok('brand', 0.18) : tok('panel')}
              stroke={red ? tok('danger') : green ? tok('safe') : on ? tok('brand') : tok('line')}>
              <T x={b.x + 6} y={b.y + 9} size={9} weight={700} fill={tok('muted')}>{b.id}{b.id === 'head' && !st.sealed ? ' (unsealed)' : ''}</T>
              <T x={b.x + 6} y={b.y + 22} size={11} mono>{b.code(st)}</T>
            </Box>
          );
        })}
        <T x={10} y={186} size={11} fill={st.bad ? tok('danger') : st.good ? tok('safe') : tok('muted')}>
          {st.bad ? 'ps → struct of arrays (wrong)' : st.good ? 'ps → kept as array of objects' : 'building SSA…'}
        </T>
      </Svg>
    </StepFrame>
  );
}
