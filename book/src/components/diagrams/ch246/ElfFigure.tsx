// Chapter 246: the inside of main.o, a relocatable ELF file made by
// llvm-mc. Sections are drawn in file order with their real offsets and
// sizes; the three relocations point at the holes they will fill.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const SECTIONS = [
  { name: 'ELF header', off: '0x000', size: '64 B', h: 22, fill: 'muted' },
  { name: '.text (code)', off: '0x040', size: '24 B', h: 92, fill: 'brand' },
  { name: '.data', off: '0x058', size: '32 B', h: 22, fill: 'f2' },
  { name: '.symtab', off: '0x078', size: '7 symbols', h: 22, fill: 'f3' },
  { name: '.rela.text', off: '0x120', size: '3 entries', h: 70, fill: 'accent' },
  { name: '.strtab', off: '0x168', size: 'names', h: 22, fill: 'f5' },
];
const CODE = ['lui  a0, 0  ← hole', 'addi a0, a0, 0  ← hole', 'li   a1, 4', 'auipc ra, 0  ← hole', 'jalr ra, 0(ra)', 'j    stop'];
const RELA = ['0x00 HI20     table', '0x04 LO12_I   table', '0x0c CALL_PLT sumsq'];

export default function ElfFigure() {
  let y = 8;
  const pos: Record<string, number> = {};
  return (
    <Svg w={400} h={312} title="The file main.o drawn as a stack of sections: the ELF header, .text with three instructions marked as holes, .data, the symbol table, .rela.text with three relocation entries whose arrows point at the holes, and the string table.">
      {SECTIONS.map((s) => {
        const top = y;
        pos[s.name] = top;
        y += s.h + 6;
        return (
          <g key={s.name}>
            <Box x={60} y={top} w={250} h={s.h} fill={tok(s.fill, 0.12)} stroke={tok(s.fill)}>
              <T x={68} y={top + 11} size={11} weight={700}>{s.name}</T>
              <T x={302} y={top + 11} size={11} anchor="end" fill={tok('muted')}>{s.size}</T>
            </Box>
            <T x={8} y={top + 11} size={11} mono fill={tok('muted')}>{s.off}</T>
          </g>
        );
      })}
      {CODE.map((c, k) => (
        <T key={k} x={76} y={pos['.text (code)'] + 26 + k * 12} size={11} mono fill={c.includes('hole') ? tok('danger') : tok('ink')}>{c}</T>
      ))}
      {RELA.map((r, k) => (
        <T key={k} x={76} y={pos['.rela.text'] + 26 + k * 14} size={11} mono>{r}</T>
      ))}
      {[0, 1, 3].map((line, k) => (
        <Arrow key={k} x1={312} y1={pos['.rela.text'] + 26 + k * 14} x2={312} y2={pos['.text (code)'] + 26 + line * 12} bend={0.9 + k * 0.25} color={tok('accent')} width={1.5} />
      ))}
      <T x={8} y={304} size={11} fill={tok('muted')}>File offsets and sizes from llvm-readelf -S main.o</T>
    </Svg>
  );
}
