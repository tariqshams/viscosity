// Chapter 117: a scavenge, Cheney style. Survivors are copied from
// from-space to to-space, starting at the roots (the stack and the
// old-to-new references the write barrier recorded), leaving forwarding
// addresses; then the spaces swap, and objects that survive a second
// scavenge are promoted to the old generation. Follows V8's descriptions
// in "Trash talk" (2019) and "Orinoco: young generation garbage
// collection" (2017). The heap here is a toy: six objects.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

type Id = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
const REFS: Record<Id, Id[]> = { A: ['B'], B: [], C: ['E'], D: ['A'], E: [], F: ['C'] };
const FROM: Id[] = ['A', 'B', 'C', 'D', 'E', 'F'];

type Cell = 'plain' | 'fwd' | 'dead';
type S = {
  from: Record<Id, Cell>;
  to: Id[];
  scan: number | null;
  oRef: string;
  rs: boolean;
  old: Id[];
  label: [string, string];
  wiped?: boolean;
  note: string;
};

const P = (over: Partial<Record<Id, Cell>> = {}): Record<Id, Cell> => ({ A: 'plain', B: 'plain', C: 'plain', D: 'plain', E: 'plain', F: 'plain', ...over });

const STATES: S[] = [
  { from: P(), to: [], scan: null, oRef: 'D', rs: true, old: [], label: ['from-space', 'to-space (empty)'], note: 'New objects are allocated one after another in from-space. Earlier, the program ran O.f = D, storing a young object into an old one. The write barrier noticed and recorded O in the remembered set.' },
  { from: P(), to: [], scan: null, oRef: 'D', rs: true, old: [], label: ['from-space', 'to-space (empty)'], note: 'Scavenge. The roots are the stack, the globals, and the remembered set: every old object that points into the young generation. Nothing else in the old generation is traced.' },
  { from: P({ A: 'fwd' }), to: ['A'], scan: 0, oRef: 'D', rs: true, old: [], label: ['from-space', 'to-space'], note: 'The stack refers to A, so A is copied to to-space. Its old copy now holds a forwarding address: “I have moved, look there”.' },
  { from: P({ A: 'fwd', D: 'fwd' }), to: ['A', 'D'], scan: 0, oRef: "D'", rs: true, old: [], label: ['from-space', 'to-space'], note: 'O.f refers to D, so D is copied too, and O’s pointer is updated to the new address.' },
  { from: P({ A: 'fwd', B: 'fwd', D: 'fwd' }), to: ['A', 'D', 'B'], scan: 1, oRef: "D'", rs: true, old: [], label: ['from-space', 'to-space'], note: 'Now scan to-space from the front. A refers to B, which hasn’t moved, so B is copied to the end. The scan pointer chases the end of to-space, like a queue.' },
  { from: P({ A: 'fwd', B: 'fwd', D: 'fwd' }), to: ['A', 'D', 'B'], scan: 2, oRef: "D'", rs: true, old: [], label: ['from-space', 'to-space'], note: 'D refers to A. A has a forwarding address, so D’s pointer is simply updated. A is not copied twice, and cycles can’t loop.' },
  { from: P({ A: 'fwd', B: 'fwd', D: 'fwd', C: 'dead', E: 'dead', F: 'dead' }), to: ['A', 'D', 'B'], scan: 3, oRef: "D'", rs: true, old: [], label: ['from-space', 'to-space'], note: 'The scan reaches the end. C, E and F were never reached: they are garbage, and the scavenger never even looked at them. The work was three copies, not six.' },
  { from: P(), to: ['A', 'D', 'B'], scan: null, oRef: "D'", rs: true, old: [], label: ['to-space (empty)', 'from-space'], wiped: true, note: 'The spaces swap. The survivors sit together with no gaps, and new objects are allocated right after them. The old from-space is simply reused, garbage and all.' },
  { from: P(), to: [], scan: null, oRef: "D''", rs: false, old: ['A', 'D', 'B'], label: ['from-space', 'to-space'], wiped: true, note: 'At the next scavenge, A, D and B survive a second time, so they are promoted: copied into the old generation instead. Now O points at an old object, so no remembered-set entry is needed.' },
];

const CW = 46;

function Cells({ ids, y, state, wiped }: { ids: (Id | null)[]; y: number; state?: Record<Id, Cell>; wiped?: boolean }) {
  return (
    <>
      {Array.from({ length: 6 }, (_, k) => {
        const id = ids[k] ?? null;
        const x = 112 + k * (CW + 2);
        const c = id && state ? state[id] : 'plain';
        const show = id && !wiped;
        return (
          <g key={k}>
            <Box x={x} y={y} w={CW} h={38} r={3} dash={!show || c === 'dead'} fill={!show ? 'transparent' : c === 'fwd' ? tok('muted', 0.12) : c === 'dead' ? 'transparent' : tok('panel')} stroke={!show ? tok('line') : c === 'dead' ? tok('danger') : tok('ink', 0.5)} opacity={c === 'dead' ? 0.6 : 1}>
              {show && (
                <>
                  <T x={x + CW / 2} y={y + 13} size={12} weight={700} anchor="middle" fill={c === 'dead' ? tok('danger') : tok('ink')}>{c === 'fwd' ? '→' + id + "'" : id}</T>
                  <T x={x + CW / 2} y={y + 29} size={9} mono anchor="middle" fill={tok('muted')}>{c === 'fwd' ? 'forward' : c === 'dead' ? 'garbage' : REFS[id].length ? '→' + REFS[id].join(',') : '·'}</T>
                </>
              )}
            </Box>
          </g>
        );
      })}
    </>
  );
}

export default function ScavengeSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="A scavenge: copy the survivors" steps={s} note={st.note}>
      <Svg w={400} h={300} title="The young generation's two semispaces, the roots, and the old generation with object O">
        <T x={4} y={10} size={11} weight={700} fill={tok('muted')}>YOUNG GENERATION</T>
        <Box x={4} y={22} w={100} h={38} fill={tok('brand', 0.08)} stroke={tok('brand')}>
          <T x={12} y={35} size={10} weight={700} fill={tok('brand')}>ROOT</T>
          <T x={12} y={50} size={11} mono>stack → A</T>
        </Box>
        <T x={396} y={10} size={10} mono anchor="end" fill={tok('muted')}>row 1: {st.label[0]}</T>
        <Cells ids={FROM} y={22} state={st.from} wiped={st.wiped} />
        <T x={4} y={94} size={10} mono fill={tok('muted')}>row 2:</T>
        <T x={4} y={110} size={10} mono fill={tok('muted')}>{st.label[1]}</T>
        <Cells ids={st.to} y={82} />
        {st.scan !== null && (
          <g>
            <Arrow x1={112 + st.scan * (CW + 2) + CW / 2} y1={150} x2={112 + st.scan * (CW + 2) + CW / 2} y2={124} color={tok('accent')} />
            <T x={112 + st.scan * (CW + 2) + CW / 2} y={158} size={10} anchor="middle" fill={tok('accent')}>scan</T>
          </g>
        )}
        <T x={4} y={180} size={11} weight={700} fill={tok('muted')}>OLD GENERATION</T>
        <Box x={4} y={190} w={392} h={56} fill={tok('panel')}>
          <Box x={12} y={198} w={84} h={40} r={3} fill={tok('panel')} stroke={tok('ink', 0.5)}>
            <T x={54} y={211} size={12} weight={700} anchor="middle">O</T>
            <T x={54} y={228} size={10} mono anchor="middle" fill={tok('muted')}>f → {st.oRef}</T>
          </Box>
          {st.old.map((id, k) => (
            <Box key={id} x={112 + k * (CW + 2)} y={198} w={CW} h={40} r={3} fill={tok('safe', 0.1)} stroke={tok('safe')}>
              <T x={112 + k * (CW + 2) + CW / 2} y={211} size={12} weight={700} anchor="middle">{id}</T>
              <T x={112 + k * (CW + 2) + CW / 2} y={228} size={9} anchor="middle" fill={tok('muted')}>promoted</T>
            </Box>
          ))}
        </Box>
        <T x={4} y={266} size={11} weight={700} fill={tok('muted')}>REMEMBERED SET (OLD → YOUNG)</T>
        <T x={4} y={286} size={12} mono fill={st.rs ? tok('ink') : tok('muted')}>{st.rs ? '{ O.f }' : '{ }'}</T>
      </Svg>
    </StepFrame>
  );
}
