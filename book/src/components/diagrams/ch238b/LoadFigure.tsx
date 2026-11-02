// Chapter 238-b (staged split of 238): how a loader maps the LOAD segments
// of the linked executable (with a 4 KiB .bss added) from the file into
// memory, from llvm-readelf -l. The RW segment is longer in memory than in
// the file: the extra bytes are zeros.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const SEGS = [
  { file: '0x000, 0x158 B', mem: '0x10000', what: 'headers', flags: 'R', fy: 24, fh: 40, my: 24, mh: 40, c: 'muted' },
  { file: '0x158, 0x40 B', mem: '0x11158', what: '.text', flags: 'R E', fy: 70, fh: 30, my: 80, mh: 30, c: 'brand' },
  { file: '0x198, 0x20 B', mem: '0x12198', what: '.data', flags: 'RW', fy: 106, fh: 22, my: 126, mh: 22, c: 'f2' },
];

export default function LoadFigure() {
  return (
    <Svg w={400} h={250} title="Left, the file prog with three loadable pieces; right, memory, where each piece is placed at its virtual address with its permissions: headers read-only at 0x10000, code read and execute at 0x11158, data read-write at 0x12198 followed by 0x1000 bytes of zeros for .bss. An arrow marks the entry point at 0x11158.">
      <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>FILE prog (offset, size)</T>
      <T x={392} y={12} size={11} weight={700} anchor="end" fill={tok('muted')}>MEMORY (address)</T>
      {SEGS.map((s) => (
        <g key={s.what}>
          <Box x={8} y={s.fy} w={140} h={s.fh} fill={tok(s.c, 0.12)} stroke={tok(s.c)}>
            <T x={14} y={s.fy + 11} size={11} weight={700}>{s.what}</T>
            {s.fh > 24 && <T x={14} y={s.fy + 24} size={11} mono fill={tok('muted')}>{s.file}</T>}
          </Box>
          <Box x={248} y={s.my} w={144} h={s.mh} fill={tok(s.c, 0.12)} stroke={tok(s.c)}>
            <T x={254} y={s.my + 11} size={11} mono>{s.mem}</T>
            <T x={386} y={s.my + 11} size={11} anchor="end" weight={700}>{s.flags}</T>
          </Box>
          <Arrow x1={150} y1={s.fy + s.fh / 2} x2={246} y2={s.my + s.mh / 2} color={tok('ink', 0.5)} width={1.5} />
        </g>
      ))}
      <T x={14} y={142} size={11} mono fill={tok('muted')}>.data: 0x198, 0x20 B</T>
      <Box x={248} y={150} w={144} h={50} fill="transparent" stroke={tok('f2')} dash>
        <T x={254} y={168} size={11}>.bss: 0x1000 B</T>
        <T x={254} y={184} size={11} fill={tok('muted')}>zeros, not in file</T>
      </Box>
      <Arrow x1={300} y1={232} x2={262} y2={112} color={tok('safe')} />
      <T x={306} y={236} size={12} weight={700} fill={tok('safe')}>entry 0x11158</T>
      <T x={8} y={236} size={11} fill={tok('muted')}>MemSiz 0x1020 &gt; FileSiz 0x20</T>
    </Svg>
  );
}
