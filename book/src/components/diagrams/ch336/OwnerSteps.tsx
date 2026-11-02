// Chapter 335-b: ownership made visible. Stack slots on the left, heap
// boxes on the right. A String's slot holds (ptr, len, cap); the arrow
// from a slot to a heap box is drawn only for the box's ONE owner, so
// `let b = a;` visibly moves the arrow. clone makes a second heap box,
// and the end of the scope drops owners in reverse order, freeing their
// heap boxes. Drop order checked with rustc 1.97 (reverse declaration
// order, as the Rust Reference's "Destructors" page specifies).
import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const CODE = `fn main() {
    let n = 7;
    let m = n;
    let a = String::from("fib");
    let b = a;
    println!("{a}"); // error!
    let c = b.clone();
} // c, then b, are dropped here`;

type Name = 'n' | 'm' | 'a' | 'b' | 'c';
type Slot = { kind: 'int'; v: number } | { kind: 'str'; owns: 'h1' | 'h2' | null };
type S = {
  line: number;
  slots: Partial<Record<Name, Slot>>;
  heap: { h1?: 'live' | 'freed'; h2?: 'live' | 'freed' };
  moved?: Name[];
  dropped?: Name[];
  hl?: Name;
  err?: boolean;
  note: string;
};

const STATES: S[] = [
  { line: 1, slots: { n: { kind: 'int', v: 7 } }, heap: {}, hl: 'n', note: 'let n = 7 puts an i32 straight into a stack slot. Its size is fixed and known, so nothing goes on the heap.' },
  { line: 2, slots: { n: { kind: 'int', v: 7 }, m: { kind: 'int', v: 7 } }, heap: {}, hl: 'm', note: 'let m = n copies the four bytes. n and m are now separate 7s, and both stay usable. Scalars like i32 are Copy types.' },
  { line: 3, slots: { n: { kind: 'int', v: 7 }, m: { kind: 'int', v: 7 }, a: { kind: 'str', owns: 'h1' } }, heap: { h1: 'live' }, hl: 'a', note: 'String::from("fib") asks the heap for room and copies the text there. The slot a holds a pointer, a length and a capacity. a is the OWNER of the heap box: the arrow.' },
  { line: 4, slots: { n: { kind: 'int', v: 7 }, m: { kind: 'int', v: 7 }, a: { kind: 'str', owns: null }, b: { kind: 'str', owns: 'h1' } }, heap: { h1: 'live' }, moved: ['a'], hl: 'b', note: 'let b = a copies the pointer, length and capacity, not the text. Two pointers to one box would mean two owners, so Rust MOVES ownership: the arrow now starts at b, and a is no longer usable.' },
  { line: 5, slots: { n: { kind: 'int', v: 7 }, m: { kind: 'int', v: 7 }, a: { kind: 'str', owns: null }, b: { kind: 'str', owns: 'h1' } }, heap: { h1: 'live' }, moved: ['a'], hl: 'a', err: true, note: 'Using a after the move is a compile error: E0382, “borrow of moved value: `a`”. The program never runs with this line in it. Delete it to go on.' },
  { line: 6, slots: { n: { kind: 'int', v: 7 }, m: { kind: 'int', v: 7 }, a: { kind: 'str', owns: null }, b: { kind: 'str', owns: 'h1' }, c: { kind: 'str', owns: 'h2' } }, heap: { h1: 'live', h2: 'live' }, moved: ['a'], hl: 'c', note: 'b.clone() makes a deep copy: a second heap box with its own copy of the text, owned by c. Clone is always written out, so you can see where copying costs time.' },
  { line: 7, slots: { n: { kind: 'int', v: 7 }, m: { kind: 'int', v: 7 }, a: { kind: 'str', owns: null }, b: { kind: 'str', owns: 'h1' }, c: { kind: 'str', owns: null } }, heap: { h1: 'live', h2: 'freed' }, moved: ['a'], dropped: ['c'], hl: 'c', note: 'The closing } ends the scope. Variables are dropped in reverse order of declaration, so c goes first: dropping a String frees its heap box.' },
  { line: 7, slots: { n: { kind: 'int', v: 7 }, m: { kind: 'int', v: 7 }, a: { kind: 'str', owns: null }, b: { kind: 'str', owns: null }, c: { kind: 'str', owns: null } }, heap: { h1: 'freed', h2: 'freed' }, moved: ['a'], dropped: ['c', 'b'], hl: 'b', note: 'Then b, the owner of the first box, which is freed exactly once. a owns nothing since the move, so dropping it frees nothing. n and m just disappear with the stack frame. No collector ran at any point.' },
];

const ORDER: Name[] = ['n', 'm', 'a', 'b', 'c'];

export default function OwnerSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const sy = (k: number) => 26 + k * 30;
  const hy = { h1: 56, h2: 146 } as const;
  return (
    <StepFrame title="One owner, then a move" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={196} title="Stack slots on the left; heap boxes on the right; an arrow from each heap box's single owner">
        <T x={8} y={10} size={11} weight={700} fill={tok('muted')}>STACK (main’s frame)</T>
        <T x={258} y={10} size={11} weight={700} fill={tok('muted')}>HEAP</T>
        {ORDER.map((name, k) => {
          const slot = st.slots[name];
          if (!slot) return null;
          const moved = st.moved?.includes(name);
          const y = sy(k);
          const hl = st.hl === name;
          const stroke = st.err && hl ? tok('danger') : hl ? tok('brand') : tok('line');
          return (
            <g key={name} opacity={moved && !(st.err && hl) ? 0.4 : 1}>
              <T x={18} y={y + 12} size={14} mono weight={700} anchor="middle">{name}</T>
              <Box x={30} y={y} w={140} h={24} r={4} fill={hl ? tok('brand', 0.12) : tok('panel')} stroke={stroke}>
                {slot.kind === 'int'
                  ? <T x={40} y={y + 12} size={12} mono fill={tok('f1')} weight={700}>{slot.v}<tspan fill={tok('muted')} fontWeight={400}>  i32</tspan></T>
                  : <T x={40} y={y + 12} size={11} mono fill={tok('ink')}>{moved ? 'moved: unusable' : st.dropped?.includes(name) ? 'dropped' : 'ptr · len 3 · cap 3'}</T>}
              </Box>
              {slot.kind === 'str' && slot.owns && st.heap[slot.owns] === 'live' && (
                <Arrow x1={170} y1={y + 12} x2={256} y2={hy[slot.owns] + 14} color={tok('brand')} />
              )}
            </g>
          );
        })}
        {(['h1', 'h2'] as const).map((h) => {
          const state = st.heap[h];
          if (!state) return null;
          const freed = state === 'freed';
          return (
            <g key={h} opacity={freed ? 0.35 : 1}>
              {['f', 'i', 'b'].map((ch, j) => (
                <Box key={j} x={258 + j * 34} y={hy[h]} w={32} h={28} r={3} dash={freed} fill={freed ? tok('panel') : tok('accent', 0.12)} stroke={freed ? tok('muted') : tok('accent')}>
                  <T x={274 + j * 34} y={hy[h] + 14} size={14} mono anchor="middle">{freed ? '' : ch}</T>
                </Box>
              ))}
              <T x={258} y={hy[h] + 40} size={11} fill={freed ? tok('danger') : tok('muted')}>{freed ? 'freed (dropped)' : h === 'h1' ? 'the first String’s text' : 'the clone’s own copy'}</T>
            </g>
          );
        })}
        {st.err && <T x={30} y={186} size={12} mono fill={tok('danger')} weight={700}>error[E0382]: borrow of moved value: `a`</T>}
      </Svg>
    </StepFrame>
  );
}
