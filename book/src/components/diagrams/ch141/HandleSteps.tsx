// Chapter 141: printing a closure in drip-rs is three trips to the heap.
// The slot numbers are real: running `fn add(a, b) { return a + b; }
// print add;` on drip-rs (book/companion/rust, Vm::interpret, then
// reading vm.heap's arenas) leaves closures [0: script, 1: add],
// functions [0: script, 1: add, arity 2] and strings [0: "init",
// 1-5: the natives' names, 6: "add"], and prints `fn add`. The lookups
// follow value.rs (Value::Closure -> write_function -> heap.str).
import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

type Slot = { arena: number; slot: number };
type S = { code: string; hot: Slot[]; arrows: [Slot, Slot][]; held: string; note: string };

const ARENAS = [
  { name: 'closures', slots: ['0 script', '1 add'], sub: ['', 'function: Gc 1'] },
  { name: 'functions', slots: ['0 script', '1 add'], sub: ['name: None', 'arity 2, name'] },
  { name: 'strings', slots: ['0 "init"', '1–5 …', '6 "add"'], sub: ['', 'natives', ''] },
];

const c1 = { arena: 0, slot: 1 };
const f1 = { arena: 1, slot: 1 };
const s6 = { arena: 2, slot: 2 };

const STATES: S[] = [
  { code: 'print add;', hot: [], arrows: [], held: 'Value::Closure(Gc 1)', note: 'The stack holds a Value::Closure, whose payload is only a handle: a Gc<ObjClosure> with index 1. To print fn add, drip-rs needs the function’s name, two objects away.' },
  { code: 'heap[c].function', hot: [c1], arrows: [], held: 'c: Gc<ObjClosure>', note: 'heap[c] calls Index::index. The handle’s type is Gc<ObjClosure>, so ObjClosure::arena picks heap.closures: that choice was made at compile time. Then slot 1 is read.' },
  { code: 'let f = &heap[function];', hot: [c1, f1], arrows: [[c1, f1]], held: 'function: Gc<ObjFunction>', note: 'The field is a Gc<ObjFunction>, which is Copy, so it was copied out and handed to write_function. The handle names slot 1 of a different arena.' },
  { code: 'match f.name { Some(name) ...', hot: [f1], arrows: [], held: 'name: StrRef', note: 'Same lookup, different arena: functions slot 1, arity 2. Its name is Some(StrRef), a string handle that also carries the string’s hash.' },
  { code: 'heap.str(name)', hot: [f1, s6], arrows: [[f1, s6]], held: '&str "add"', note: 'heap.str(name) is &heap.strings[name.handle].chars, a &str borrowed from the heap. write_function pushes "fn " and then it.' },
  { code: '// prints: fn add', hot: [], arrows: [], held: '', note: 'Slot 0 of closures and functions is the top-level script; strings 0 to 5 were interned when the VM started. TypeScript followed references; drip-rs did three indexed lookups, each in the arena its handle’s type names.' },
];

const SX = 104;
const SW = 92;
const rowY = (a: number) => 56 + a * 70;
const slotX = (s: number) => SX + s * (SW + 4);

export default function HandleSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const isHot = (a: number, k: number) => st.hot.some((h) => h.arena === a && h.slot === k);
  return (
    <StepFrame title="Printing a closure: three trips to the heap" steps={s} note={st.note}>
      <Svg w={400} h={286} title="Three arenas of the drip-rs heap, with the slots each lookup reads">
        <Box x={8} y={6} w={384} h={36} r={4} fill={tok('panel')} stroke={tok('line')}>
          <T x={16} y={18} size={12} mono weight={700}>{st.code}</T>
          {st.held && <T x={16} y={33} size={11} mono fill={tok('brand')}>holding {st.held}</T>}
        </Box>
        {ARENAS.map((a, ai) => (
          <g key={a.name}>
            <T x={8} y={rowY(ai) + 22} size={12} mono weight={700}>{a.name}</T>
            {a.slots.map((text, k) => {
              const hot = isHot(ai, k);
              return (
                <Box key={k} x={slotX(k)} y={rowY(ai)} w={SW} h={44} r={3}
                  fill={hot ? tok('brand', 0.16) : tok('panel')} stroke={hot ? tok('brand') : tok('line')}>
                  <T x={slotX(k) + 6} y={rowY(ai) + 14} size={12} mono fill={hot ? tok('ink') : tok('muted')}>{text}</T>
                  <T x={slotX(k) + 6} y={rowY(ai) + 32} size={11} mono fill={tok('muted')}>{a.sub[k]}</T>
                </Box>
              );
            })}
          </g>
        ))}
        {st.arrows.map(([from, to], k) => (
          <Arrow key={k} x1={slotX(from.slot) + SW / 2} y1={rowY(from.arena) + 44}
            x2={slotX(to.slot) + SW / 2} y2={rowY(to.arena)} color={tok('accent')} bend={to.slot === from.slot ? 0 : 0.2} />
        ))}
        <T x={8} y={276} size={11} fill={tok('muted')}>Each row is one Arena&lt;T&gt; in the Heap; boxes are slots.</T>
      </Svg>
    </StepFrame>
  );
}
