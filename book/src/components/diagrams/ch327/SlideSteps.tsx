// Chapter 327: Lisp 2 sliding compaction on the exercise's heap: twelve
// words holding a dead object, A, a dead object, B and C. Pass 1 computes
// forwarding addresses, pass 2 rewrites pointers, pass 3 slides each live
// object down to its forwarding address.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

type O = { n: string; at: number; size: number; live: boolean; ref: string; fwd?: number };
type S = { objs: O[]; free: number | null; roots: string; pass: string; note: string };

const base = (): O[] => [
  { n: '', at: 0, size: 2, live: false, ref: '' },
  { n: 'A', at: 2, size: 3, live: true, ref: '→9' },
  { n: '', at: 5, size: 4, live: false, ref: '' },
  { n: 'B', at: 9, size: 2, live: true, ref: '→2' },
  { n: 'C', at: 11, size: 1, live: true, ref: '' },
];
const set = (f: (o: O[]) => void) => { const o = base(); f(o); return o; };

const STATES: S[] = [
  { objs: base(), free: null, roots: '9, 11', pass: 'after marking', note: 'Marking is done: A, B and C are live, and the hatched blocks are dead. A (at 2) points at B (at 9), and B points back at A. The roots hold 9 and 11. Free memory is in two holes, of 2 and 4 words.' },
  { objs: set((o) => { o[1].fwd = 0; }), free: 3, roots: '9, 11', pass: 'pass 1: new addresses', note: 'Pass 1 walks the heap in order with free = 0. The dead block is skipped. A is live: its new address is 0, written into A itself, and free becomes 0 + 3 = 3.' },
  { objs: set((o) => { o[1].fwd = 0; o[3].fwd = 3; o[4].fwd = 5; }), free: 6, roots: '9, 11', pass: 'pass 1: new addresses', note: 'B gets 3 and C gets 5. Each new address is the total size of the live objects before it. Nothing has moved yet, so every old address still finds its object.' },
  { objs: set((o) => { o[1].fwd = 0; o[3].fwd = 3; o[4].fwd = 5; o[1].ref = '→3'; o[3].ref = '→0'; }), free: 6, roots: '3, 5', pass: 'pass 2: update pointers', note: 'Pass 2 rewrites every pointer: A\'s 9 becomes B\'s new address, 3; B\'s 2 becomes A\'s, 0; the roots become 3 and 5. Each lookup reads the forwarding address from the object still sitting at the old address.' },
  { objs: set((o) => { o[1].fwd = 0; o[3].fwd = 3; o[4].fwd = 5; o[1].ref = '→3'; o[3].ref = '→0'; o[1].at = 0; o[0].size = 0; }), free: 6, roots: '3, 5', pass: 'pass 3: move', note: 'Pass 3 moves each live object to its new address, in order. A slides from 2 down to 0, over the dead block.' },
  { objs: [{ n: 'A', at: 0, size: 3, live: true, ref: '→3', fwd: 0 }, { n: 'B', at: 3, size: 2, live: true, ref: '→0', fwd: 3 }, { n: 'C', at: 5, size: 1, live: true, ref: '', fwd: 5 }], free: 6, roots: '3, 5', pass: 'done', note: 'B slides to 3 and C to 5; each moved down, into space already passed, so nothing was overwritten early. The six free words from 6 to 11 are one run, ready for bump allocation. Order is kept: A, B, C.' },
];

const W = 31;
const X = (a: number) => 14 + a * W;

export default function SlideSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Lisp 2 sliding compaction" steps={s} note={st.note}>
      <Svg w={400} h={200} title="A heap of twelve words with live objects A, B and C and dead blocks, compacted in three passes">
        <T x={8} y={14} size={11} weight={700} fill={tok('muted')}>{st.pass.toUpperCase()}</T>
        {Array.from({ length: 12 }, (_, k) => (
          <T key={k} x={X(k) + W / 2} y={38} size={11} anchor="middle" fill={tok('muted')}>{k}</T>
        ))}
        <Box x={X(0)} y={48} w={12 * W} h={50} r={3} fill="transparent" stroke={tok('line')} dash />
        {st.objs.filter((o) => o.size > 0).map((o, k) => (
          <g key={k}>
            <Box x={X(o.at) + 1} y={50} w={o.size * W - 2} h={46} r={3}
              fill={o.live ? tok('safe', 0.3) : tok('danger', 0.08)} stroke={o.live ? tok('safe') : tok('danger', 0.6)} dash={!o.live}>
              {o.live && <T x={X(o.at) + (o.size * W) / 2} y={66} size={13} weight={700} anchor="middle">{o.n}</T>}
              {o.live && o.ref && <T x={X(o.at) + (o.size * W) / 2} y={84} size={11} mono anchor="middle">{o.ref}</T>}
              {!o.live && <T x={X(o.at) + (o.size * W) / 2} y={73} size={11} anchor="middle" fill={tok('danger')}>dead</T>}
            </Box>
            {o.fwd !== undefined && <T x={X(o.at) + (o.size * W) / 2} y={112} size={11} mono anchor="middle" fill={tok('brand')}>{`fwd ${o.fwd}`}</T>}
          </g>
        ))}
        {st.free !== null && (
          <g>
            <line x1={X(st.free)} x2={X(st.free)} y1={124} y2={142} stroke={tok('brand')} strokeWidth={2} />
            <T x={X(st.free) + 4} y={146} size={11} weight={700} fill={tok('brand')}>free</T>
          </g>
        )}
        <T x={8} y={176} size={12} mono>{`roots: ${st.roots}`}</T>
        {st.pass === 'done' && <T x={392} y={176} size={11} anchor="end" fill={tok('safe')}>words 6 to 11: one free run</T>}
      </Svg>
    </StepFrame>
  );
}
