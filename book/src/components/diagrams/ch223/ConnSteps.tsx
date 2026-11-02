// Chapter 223: building a connection graph (Choi et al. 1999, as HotSpot's
// C2 implements it) for one small function, removing the deferred edges,
// and then colouring each object by how far it escapes.
import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const CODE = `let G = null;
function f() {
  const p = { v: 1 };   // o1
  const q = { v: 2 };   // o2
  const r = { v: 3 };   // o3
  p.next = q;
  use(r);   // use only reads r
  G = q;
}`;

type Esc = 'none' | 'no' | 'arg' | 'global';
type S = { line: number | null; edges: string[]; esc: Record<string, Esc>; fields: string[]; g?: boolean; arg?: boolean; note: string };

const N0: Record<string, Esc> = { o1: 'none', o2: 'none', o3: 'none' };
const ALLOC = ['p-o1', 'q-o2', 'r-o3'];
const DEF = ['o1-next', 'next~q', 'arg~r', 'G~q'];
const BYPASS = ['o1-next', 'next-o2', 'arg-o3', 'G-o2'];
const INIT: Record<string, Esc> = { o1: 'no', o2: 'no', o3: 'no' };

const STATES: S[] = [
  { line: null, edges: [], fields: [], esc: N0, note: 'A connection graph has three kinds of node: objects (one per allocation site), local variables, and fields of objects. We build it for f alone, one statement at a time.' },
  { line: 2, edges: ALLOC, fields: [], esc: N0, note: 'Case 1, p = new: a points-to edge from the variable to the object. Three allocations, three edges.' },
  { line: 5, edges: [...ALLOC, 'o1-next', 'next~q'], fields: ['next'], esc: N0, note: 'Case 3, p.f = q: o1 gets a field node next, and next gets a DEFERRED edge (dashed) to the variable q, meaning “next holds whatever q holds”.' },
  { line: 6, edges: [...ALLOC, 'o1-next', 'next~q', 'arg~r'], fields: ['next'], arg: true, esc: N0, note: 'use(r): the call’s argument slot is a node too, and it holds whatever r holds (case 2, a copy).' },
  { line: 7, edges: [...ALLOC, ...DEF], fields: ['next'], arg: true, g: true, esc: N0, note: 'Case 2 again, G = q: a deferred edge from the global G to q.' },
  { line: null, edges: [...ALLOC, ...BYPASS], fields: ['next'], arg: true, g: true, esc: N0, note: 'Now every deferred edge is bypassed: wherever x ⇢ y, x points at whatever y points at. next → o2, the argument → o3, G → o2. Only points-to and field edges remain.' },
  { line: null, edges: [...ALLOC, ...BYPASS], fields: ['next'], arg: true, g: true, esc: INIT, note: 'Starting states: a global is GlobalEscape; an argument to a call that does not keep it (we know use only reads) is ArgEscape; every object made in f starts as NoEscape.' },
  { line: null, edges: [...ALLOC, ...BYPASS], fields: ['next'], arg: true, g: true, esc: { ...INIT, o2: 'global' }, note: 'Spread GlobalEscape along the edges: G reaches o2, so o2 is GlobalEscape. It must be a real heap object; any code, on any thread, may find it.' },
  { line: null, edges: [...ALLOC, ...BYPASS], fields: ['next'], arg: true, g: true, esc: { ...INIT, o2: 'global', o3: 'arg' }, note: 'Spread ArgEscape: the argument slot reaches o3. o3 is handed to use, but use keeps no reference and runs on this thread.' },
  { line: null, edges: [...ALLOC, ...BYPASS], fields: ['next'], arg: true, g: true, esc: { ...INIT, o2: 'global', o3: 'arg' }, note: 'Verdict: o1 is NoEscape even though it points at an escaping object (pointing OUT is harmless; being pointed AT from outside is not). o1 can live in f’s stack frame or be split into scalars.' },
];

const POS: Record<string, [number, number]> = {
  p: [32, 36], q: [32, 92], r: [32, 148], arg: [32, 204],
  o1: [168, 36], o2: [168, 92], o3: [168, 148],
  next: [284, 36], G: [360, 92],
};
const COLOR: Record<Esc, string> = { none: 'line', no: 'safe', arg: 'warn', global: 'danger' };
const LABEL: Record<Esc, string> = { none: '', no: 'NoEscape', arg: 'ArgEscape', global: 'GlobalEscape' };

export default function ConnSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const edge = (e: string) => {
    const deferred = e.includes('~');
    const [a, b] = e.split(deferred ? '~' : '-');
    const [x1, y1] = POS[a];
    const [x2, y2] = POS[b];
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.hypot(dx, dy);
    const ka = (a === 'G' ? 26 : 30) / len;
    const kb = 32 / len;
    return <Arrow key={e} x1={x1 + dx * ka} y1={y1 + dy * ka} x2={x2 - dx * kb} y2={y2 - dy * kb} dash={deferred} color={deferred ? tok('accent') : tok('ink', 0.6)} bend={e === 'next~q' ? -0.25 : e === 'G~q' ? 0.3 : 0} />;
  };
  return (
    <StepFrame title="A connection graph, built and coloured" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={236} title="Variables p, q, r and the argument slot of use on the left, objects o1, o2 and o3 in the middle, the field next and the global G on the right">
        {st.edges.map(edge)}
        {['p', 'q', 'r'].map((v) => (
          <Box key={v} x={POS[v][0] - 24} y={POS[v][1] - 13} w={48} h={26}>
            <T x={POS[v][0]} y={POS[v][1]} size={13} mono weight={700} anchor="middle">{v}</T>
          </Box>
        ))}
        {st.arg && (
          <Box x={POS.arg[0] - 28} y={POS.arg[1] - 13} w={56} h={26} fill={st.esc.o1 === 'none' ? tok('panel') : tok('warn', 0.12)} stroke={st.esc.o1 === 'none' ? tok('line') : tok('warn')}>
            <T x={POS.arg[0]} y={POS.arg[1]} size={12} mono anchor="middle">use(·)</T>
          </Box>
        )}
        {['o1', 'o2', 'o3'].map((o) => {
          const e = st.esc[o];
          return (
            <g key={o}>
              <Box x={POS[o][0] - 30} y={POS[o][1] - 15} w={60} h={30} r={9} fill={e === 'none' ? tok('panel') : tok(COLOR[e], 0.14)} stroke={tok(COLOR[e])}>
                <T x={POS[o][0]} y={POS[o][1]} size={13} mono anchor="middle">{o}</T>
              </Box>
              {e !== 'none' && <T x={POS[o][0]} y={POS[o][1] + 24} size={11} anchor="middle" fill={tok(COLOR[e])}>{LABEL[e]}</T>}
            </g>
          );
        })}
        {st.fields.map((f) => (
          <Box key={f} x={POS[f][0] - 26} y={POS[f][1] - 12} w={52} h={24} r={3} dash>
            <T x={POS[f][0]} y={POS[f][1]} size={12} mono anchor="middle">.{f}</T>
          </Box>
        ))}
        {st.g && (
          <Box x={POS.G[0] - 22} y={POS.G[1] - 13} w={44} h={26} fill={tok('danger', 0.12)} stroke={tok('danger')}>
            <T x={POS.G[0]} y={POS.G[1]} size={13} mono weight={700} anchor="middle">G</T>
          </Box>
        )}
      </Svg>
    </StepFrame>
  );
}
