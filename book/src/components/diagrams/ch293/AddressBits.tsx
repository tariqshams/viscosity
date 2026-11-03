// Chapter 293: the address-width bet behind 64-bit NaN-boxing. Three
// 64-bit words, drawn bit 63 on the left: a user-space pointer under
// 4-level paging (47 significant bits), the SpiderMonkey PUNBOX64 object
// Value that holds it (tag 0x1fffc in bits 63..47, per js/public/Value.h),
// and a 56-bit user address under 5-level paging, whose bits 55..47 would
// land in the tag field.
import { Box, Svg, T, tok } from '../../viz/svg';

const X0 = 20;
const W = 360;
const bit = (b: number) => X0 + ((63 - b) / 64) * W; // left edge of bit b
const span = (hi: number, lo: number) => ({ x: bit(hi), w: ((hi - lo + 1) / 64) * W });

type Seg = { hi: number; lo: number; fill: string; stroke: string; label: string };

function Word({ y, title, segs, hex }: { y: number; title: string; segs: Seg[]; hex: string }) {
  return (
    <g>
      <T x={X0} y={y} size={12} weight={700}>{title}</T>
      {segs.map((s) => {
        const { x, w } = span(s.hi, s.lo);
        return (
          <g key={s.hi}>
            <Box x={x} y={y + 8} w={w} h={24} r={2} fill={s.fill} stroke={s.stroke} />
            <T x={x + w / 2} y={y + 24} size={10} anchor="middle">{s.label}</T>
          </g>
        );
      })}
      <T x={X0} y={y + 48} size={11} mono fill={tok('muted')}>{hex}</T>
    </g>
  );
}

export default function AddressBits() {
  const zero = { fill: tok('line', 0.2), stroke: tok('muted') };
  const addr = { fill: tok('accent', 0.15), stroke: tok('accent') };
  const tag = { fill: tok('brand', 0.18), stroke: tok('brand') };
  const clash = { fill: tok('danger', 0.18), stroke: tok('danger') };
  return (
    <Svg w={400} h={232} title="Three 64-bit words. A user-space pointer: 17 zero bits on top, then a 47-bit address. A SpiderMonkey object Value: the 17-bit tag 0x1fffc on top of the same 47-bit address. A 5-level address: 8 zero bits, then 9 address bits that fall where the tag goes, then 47 more.">
      <T x={X0} y={12} size={10} fill={tok('muted')}>bit 63</T>
      <T x={X0 + W} y={12} size={10} anchor="end" fill={tok('muted')}>bit 0</T>
      <Word y={30} title="a user-space pointer (4-level paging)" hex="0x00007f1234567890"
        segs={[{ hi: 63, lo: 47, ...zero, label: '17 zero bits' }, { hi: 46, lo: 0, ...addr, label: '47-bit address' }]} />
      <Word y={100} title="SpiderMonkey object Value holding it" hex="0xfffe7f1234567890"
        segs={[{ hi: 63, lo: 47, ...tag, label: 'tag 0x1fffc' }, { hi: 46, lo: 0, ...addr, label: 'the same 47 bits' }]} />
      <Word y={170} title="a 56-bit address (5-level paging)" hex="0x00a0123456789abc"
        segs={[{ hi: 63, lo: 56, ...zero, label: '0' }, { hi: 55, lo: 47, ...clash, label: 'clash' }, { hi: 46, lo: 0, ...addr, label: '47 low bits' }]} />
    </Svg>
  );
}
