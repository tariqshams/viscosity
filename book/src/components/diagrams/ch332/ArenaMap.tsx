// Chapter 332: the shape of drip-rs's heap (book/companion/rust/src/gc.rs
// and object.rs). The Heap owns one Arena<T> per kind of object (nine in
// all; four are drawn). A Value on the VM's stack holds a Gc<T>, a typed
// u32 index, and objects refer to each other the same way: an
// ObjClosure's `function` field is a Gc<ObjFunction>, an ObjInstance's
// `class` field is a Gc<ObjClass>, and a class's method table holds
// Value::Closure handles. The slot numbers are only an illustration.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const ARENAS = [
  { name: 'functions', y: 40, slots: ['fn area', 'fn speak', 'script'] },
  { name: 'closures', y: 92, slots: ['→ fn 0', '→ fn 1', ''] },
  { name: 'classes', y: 144, slots: ['Dog', '', ''] },
  { name: 'instances', y: 196, slots: ['→ class 0', '', ''] },
];

const SX = 170; // first slot's x
const SW = 72; // slot width
const SH = 26; // slot height

export default function ArenaMap() {
  const slot = (a: number, k: number) => ({ x: SX + k * (SW + 4), y: ARENAS[a].y });
  const mid = (a: number, k: number) => ({ x: slot(a, k).x + SW / 2, y: slot(a, k).y + SH / 2 });
  return (
    <Svg w={400} h={262} title="The VM's stack holds handles; the heap's arenas hold the objects, which point at each other by handle">
      <T x={8} y={14} size={11} weight={700} fill={tok('accent')}>VM stack (Values)</T>
      <T x={SX} y={14} size={11} weight={700} fill={tok('brand')}>Heap: one arena per kind</T>
      {/* stack values */}
      <Box x={8} y={96} w={128} h={SH} r={3} fill={tok('accent', 0.14)} stroke={tok('accent')}>
        <T x={16} y={109} size={11} mono>Closure(Gc 0)</T>
      </Box>
      <Box x={8} y={200} w={128} h={SH} r={3} fill={tok('accent', 0.14)} stroke={tok('accent')}>
        <T x={16} y={213} size={11} mono>Instance(Gc 0)</T>
      </Box>
      {ARENAS.map((a, i) => (
        <g key={a.name}>
          <T x={SX} y={a.y - 7} size={11} mono fill={tok('muted')}>{a.name}</T>
          {a.slots.map((s, k) => (
            <g key={k}>
              <Box x={slot(i, k).x} y={a.y} w={SW} h={SH} r={3}
                fill={s ? tok('brand', 0.12) : tok('panel')} stroke={s ? tok('brand') : tok('line')} dash={!s}>
                <T x={mid(i, k).x} y={mid(i, k).y} size={11} mono anchor="middle">{s || 'free'}</T>
              </Box>
              <T x={slot(i, k).x + 4} y={a.y + SH + 7} size={11} mono fill={tok('muted')}>{k}</T>
            </g>
          ))}
        </g>
      ))}
      {/* stack -> arenas */}
      <Arrow x1={136} y1={109} x2={SX - 2} y2={mid(1, 0).y} color={tok('accent')} />
      <Arrow x1={136} y1={213} x2={SX - 2} y2={mid(3, 0).y} color={tok('accent')} />
      {/* object -> object, by handle */}
      <Arrow x1={mid(1, 0).x} y1={92} x2={mid(0, 0).x} y2={66} color={tok('brand')} width={1.6} />
      <Arrow x1={mid(1, 1).x} y1={92} x2={mid(0, 1).x} y2={66} color={tok('brand')} width={1.6} />
      <Arrow x1={mid(3, 0).x} y1={196} x2={mid(2, 0).x} y2={170} color={tok('brand')} width={1.6} />
      <Arrow x1={slot(2, 0).x + SW} y1={mid(2, 0).y} x2={mid(1, 1).x} y2={118} color={tok('safe')} width={1.6} bend={0.5} dash />
      <T x={8} y={246} size={11} fill={tok('muted')}>Dashed: Dog’s method table holds speak’s closure.</T>
    </Svg>
  );
}
