// Chapter 158: the VM's roots (what markRoots and Heap.collect start from)
// and a few heap objects, some reachable through a chain of references and
// some not. Follows VM.markRoots in companion/ts/src/vm/vm.ts and the start
// of Heap.collect in heap.ts.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const ROOTS = [
  'value stack (0..sp)',
  'frames’ closures',
  'open upvalues',
  'globals table',
  'the "init" string',
  'compiler’s functions',
  'extraRoots',
];

type N = { id: string; x: number; y: number; live: boolean; label: string };
const OBJS: N[] = [
  { id: 'list', x: 236, y: 30, live: true, label: 'list [1, 2]' },
  { id: 'clo', x: 236, y: 88, live: true, label: 'closure' },
  { id: 'up', x: 236, y: 146, live: true, label: 'upvalue' },
  { id: 'str', x: 236, y: 204, live: true, label: 'string "a"' },
  { id: 'old', x: 330, y: 88, live: false, label: 'old list' },
  { id: 'cyc', x: 330, y: 176, live: false, label: 'instance' },
];

export default function RootsFigure() {
  const ry = (i: number) => 22 + i * 32;
  const o = (id: string) => OBJS.find((n) => n.id === id)!;
  return (
    <Svg w={400} h={252} title="Seven kinds of root on the left; arrows lead to a list, a closure, its upvalue and a string, which are live. An old list and an instance that only refer to each other are unreachable.">
      {ROOTS.map((r, i) => (
        <Box key={r} x={4} y={ry(i) - 12} w={152} h={24} r={3} fill={tok('brand', 0.08)} stroke={tok('brand')}>
          <T x={12} y={ry(i)} size={11}>{r}</T>
        </Box>
      ))}
      <Arrow x1={156} y1={ry(0)} x2={194} y2={o('list').y} color={tok('brand')} />
      <Arrow x1={156} y1={ry(1)} x2={194} y2={o('clo').y} color={tok('brand')} />
      <Arrow x1={156} y1={ry(3)} x2={194} y2={o('str').y - 4} color={tok('brand')} />
      <Arrow x1={236} y1={o('clo').y + 12} x2={236} y2={o('up').y - 14} />
      <Arrow x1={330} y1={o('old').y + 12} x2={330} y2={o('cyc').y - 14} bend={0.4} />
      <Arrow x1={330} y1={o('cyc').y - 14} x2={330} y2={o('old').y + 12} bend={0.4} />
      {OBJS.map((n) => (
        <g key={n.id} opacity={n.live ? 1 : 0.55}>
          <Box x={n.x - 42} y={n.y - 12} w={84} h={24} r={3} fill={n.live ? tok('panel') : tok('line', 0.15)} stroke={n.live ? tok('ink', 0.6) : tok('muted')} dash={!n.live}>
            <T x={n.x} y={n.y} size={11} mono anchor="middle">{n.label}</T>
          </Box>
        </g>
      ))}
      <T x={330} y={208} size={11} fill={tok('muted')} anchor="middle">unreachable</T>
      <T x={236} y={236} size={11} fill={tok('muted')} anchor="middle">reachable: live</T>
    </Svg>
  );
}
