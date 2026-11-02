// Chapter 340: printing a closure in drip-rs is three trips to the heap.
// The slot numbers are real: running `fn add(a, b) { return a + b; }
// print add;` in book/companion/rust (Vm::interpret, then reading
// vm.heap's arenas) leaves closures [0: script, 1: add], functions
// [0: script, 1: add (arity 2)] and strings [0: "init", 1: "clock",
// 2: "add"], and prints `<fn add>`. The lookups follow value.rs.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

type Slot = { arena: number; slot: number };
type S = { code: string; hot: Slot[]; arrows: [Slot, Slot][]; held: string; note: string };

const ARENAS = [
  { name: 'closures', type: 'Arena<ObjClosure>', slots: ['script', 'function: Gc(1)\nupvalues: []'] },
  { name: 'functions', type: 'Arena<ObjFunction>', slots: ['script\nname: None', 'arity: 2\nname: Some(…)'] },
  { name: 'strings', type: 'Arena<ObjString>', slots: ['"init"', '"clock"', '"add"'] },
];

const c1 = { arena: 0, slot: 1 };
const f1 = { arena: 1, slot: 1 };
const s2 = { arena: 2, slot: 2 };

const STATES: S[] = [
  { code: 'print add;', hot: [], arrows: [], held: 'Value::Closure(Gc(1))', note: 'The stack holds a Value::Closure. Its payload is only a handle, Gc<ObjClosure> with index 1. To print `<fn add>`, drip-rs needs the function’s name, two objects away.' },
  { code: 'heap[c]', hot: [c1], arrows: [], held: 'c: Gc<ObjClosure>(1)', note: 'Indexing calls Index::index. The handle’s type is Gc<ObjClosure>, so ObjClosure::arena picks heap.closures. That choice was made at compile time. Then slot 1 is read.' },
  { code: 'let func = heap[c].function;', hot: [c1, f1], arrows: [[c1, f1]], held: 'func: Gc<ObjFunction>(1)', note: 'The field is a Gc<ObjFunction>, which is Copy, so it is copied out. The borrow of the heap ends at the semicolon. The handle now names a slot in a different arena.' },
  { code: 'heap[func].name', hot: [f1], arrows: [], held: 'StrRef { Gc(2), hash }', note: 'Same lookup, different arena: functions slot 1, arity 2. Its name is Some(StrRef), a string handle plus the string’s hash (chapter 342).' },
  { code: 'heap.str(name)', hot: [f1, s2], arrows: [[f1, s2]], held: '&str "add"', note: 'heap.str(name) is &heap.strings[name.handle].chars. It returns a &str borrowed from the heap, which write! prints as <fn add>.' },
  { code: '// <fn add>', hot: [], arrows: [], held: '', note: 'Slot 0 of closures and functions is the top-level script. Strings 0 and 1 were interned when the VM started. TypeScript followed three pointers here; drip-rs did three indexed lookups, each in the arena its handle’s type names.' },
];

const SX = 112;
const SW = 92;
const rowY = (a: number) => 60 + a * 64;
const slotX = (s: number) => SX + s * (SW + 4);

export default function HandleSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const isHot = (a: number, k: number) => st.hot.some((h) => h.arena === a && h.slot === k);
  return (
    <StepFrame title="Printing a closure: three trips to the heap" steps={s} note={st.note}>
      <Svg w={400} h={268} title="Three arenas of the drip-rs heap, with the slots each lookup reads">
        <Box x={8} y={6} w={384} h={30} r={4} fill={tok('panel')} stroke={tok('line')}>
          <T x={16} y={21} size={12} mono weight={700}>{st.code}</T>
          {st.held && <T x={384} y={21} size={10} mono anchor="end" fill={tok('brand')}>{st.held}</T>}
        </Box>
        {ARENAS.map((a, ai) => (
          <g key={a.name}>
            <T x={8} y={rowY(ai) + 14} size={11} mono weight={700}>{a.name}</T>
            <T x={8} y={rowY(ai) + 30} size={8} mono fill={tok('muted')}>{a.type}</T>
            {a.slots.map((text, k) => {
              const hot = isHot(ai, k);
              return (
                <g key={k}>
                  <Box x={slotX(k)} y={rowY(ai)} w={SW} h={44} r={3}
                    fill={hot ? tok('brand', 0.16) : tok('panel')} stroke={hot ? tok('brand') : tok('line')}>
                    <T x={slotX(k) + 4} y={rowY(ai) + 8} size={8} mono fill={tok('muted')}>{k}</T>
                    {text.split('\n').map((line, j) => (
                      <T key={j} x={slotX(k) + 14} y={rowY(ai) + 18 + j * 13} size={8} mono fill={hot ? tok('ink') : tok('muted')}>{line}</T>
                    ))}
                  </Box>
                </g>
              );
            })}
          </g>
        ))}
        {st.arrows.map(([from, to], k) => (
          <Arrow key={k} x1={slotX(from.slot) + SW / 2} y1={rowY(from.arena) + 44}
            x2={slotX(to.slot) + SW / 2} y2={rowY(to.arena)} color={tok('accent')} bend={to.slot === from.slot ? 0 : 0.2} />
        ))}
        <T x={8} y={258} size={10} fill={tok('muted')}>Each row is one Arena&lt;T&gt; inside the Heap; boxes are slots.</T>
      </Svg>
    </StepFrame>
  );
}
