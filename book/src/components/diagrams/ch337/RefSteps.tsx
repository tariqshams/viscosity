// Chapter 337: borrowing across a call. main's frame owns a String and an
// i32; count(&name) gets a frame whose parameter is a reference (an arrow
// to name's slot, not to a copy), uses it, and leaves without dropping
// anything. bump(&mut hits) writes through its reference with *n += 1.
import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const CODE = `fn count(s: &String) -> usize {
    s.len()
}
fn bump(n: &mut i32) {
    *n += 1;
}
fn main() {
    let name = String::from("drip");
    let n = count(&name);
    let mut hits = 0;
    bump(&mut hits);
    println!("{name} {n} {hits}");
}`;

type Callee = { kind: 'count' | 'bump'; label: string; extra?: string };
type S = { line: number; name: boolean; n?: number; hits?: number; callee?: Callee; out?: string; note: string };

const STATES: S[] = [
  { line: 7, name: true, note: 'name owns a String: its slot in main’s frame points at the text "drip" on the heap.' },
  { line: 8, name: true, callee: { kind: 'count', label: 's: &String' }, note: 'count(&name) lends name. count gets a frame of its own, and its parameter s is a reference: an arrow to name’s slot. Nothing is copied and nothing moves.' },
  { line: 1, name: true, callee: { kind: 'count', label: 's: &String', extra: 's.len() is 4' }, note: 's.len() follows the arrow to read the string. Method calls follow references for you, so no * is needed here.' },
  { line: 8, name: true, n: 4, note: 'count returns 4 and its frame is gone, s with it. Dropping a reference drops nothing: name still owns its string, and is still usable.' },
  { line: 9, name: true, n: 4, hits: 0, note: 'let mut hits = 0. To lend something for changing, its owner must be mut.' },
  { line: 10, name: true, n: 4, hits: 0, callee: { kind: 'bump', label: 'n: &mut i32' }, note: 'bump(&mut hits) lends hits mutably. The &mut at the call, and in bump’s signature, tell every reader that bump may change hits.' },
  { line: 4, name: true, n: 4, hits: 1, callee: { kind: 'bump', label: 'n: &mut i32', extra: '*n += 1 writes' }, note: '*n follows the arrow to the i32 itself, and += 1 changes it in main’s frame. Without the *, n += 1 would try to add to the reference (E0368).' },
  { line: 11, name: true, n: 4, hits: 1, out: 'drip 4 1', note: 'Both borrows are over. main still owns everything, and prints drip 4 1.' },
];

export default function RefSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const slotY = { name: 40, n: 74, hits: 108 } as const;
  const target = st.callee?.kind === 'count' ? slotY.name : slotY.hits;
  return (
    <StepFrame title="Lending across a call" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={170} title="main's frame, a called function's frame holding a reference, and the heap">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>main’s frame</T>
        <Box x={4} y={20} w={150} h={122} fill="transparent" stroke={tok('line')} dash />
        {st.name && <Var y={slotY.name} name="name" text="ptr len cap" />}
        {st.n !== undefined && <Var y={slotY.n} name="n" text={String(st.n)} />}
        {st.hits !== undefined && <Var y={slotY.hits} name="hits" text={String(st.hits)} hl={st.callee?.kind === 'bump'} />}
        {st.name && (
          <g>
            <Arrow x1={146} y1={slotY.name + 12} x2={318} y2={36} color={tok('ink', 0.5)} />
            <Box x={320} y={24} w={70} h={24} fill={tok('accent', 0.12)} stroke={tok('accent')}>
              <T x={355} y={36} size={13} mono anchor="middle">"drip"</T>
            </Box>
            <T x={355} y={14} size={11} weight={700} anchor="middle" fill={tok('muted')}>heap</T>
          </g>
        )}
        {st.callee && (
          <g>
            <T x={186} y={76} size={11} weight={700} fill={tok('brand')}>{st.callee.kind}’s frame</T>
            <Box x={182} y={84} w={130} h={58} fill={tok('brand', 0.08)} stroke={tok('brand')}>
              <T x={192} y={102} size={12} mono weight={700}>{st.callee.label}</T>
              {st.callee.extra && <T x={192} y={126} size={11} fill={tok('muted')}>{st.callee.extra}</T>}
            </Box>
            <Arrow x1={182} y1={100} x2={150} y2={target + 12} color={st.callee.kind === 'bump' ? tok('warn') : tok('safe')} width={2.5} />
          </g>
        )}
        {st.out && <T x={182} y={160} size={13} mono>prints: {st.out}</T>}
      </Svg>
    </StepFrame>
  );
}

function Var({ y, name, text, hl }: { y: number; name: string; text: string; hl?: boolean }) {
  return (
    <g>
      <T x={12} y={y + 12} size={12} mono weight={700}>{name}</T>
      <Box x={58} y={y} w={88} h={24} fill={hl ? tok('warn', 0.15) : tok('panel')} stroke={hl ? tok('warn') : tok('ink', 0.5)}>
        <T x={102} y={y + 12} size={12} mono anchor="middle">{text}</T>
      </Box>
    </g>
  );
}
