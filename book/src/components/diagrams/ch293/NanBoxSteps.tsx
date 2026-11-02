// Chapter 86: NaN-boxing, bit by bit. Shows the high 32-bit word of a
// 64-bit double for several values, with the IEEE 754 fields marked, and
// the low word in hex. The boxing scheme is the chapter's own teaching
// example (quiet NaN plus one "boxed" bit, a 16-bit tag and a 32-bit
// payload); the companion VM does not use NaN-boxing.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Svg, T, tok } from '../../viz/svg';

type S = { label: string; hi: number; lo: number; kind: 'number' | 'boxed'; reads: string; note: string };

const BOX = 0x7ffc0000;
const STATES: S[] = [
  { label: '1.5', hi: 0x3ff80000, lo: 0, kind: 'number', reads: 'number 1.5', note: 'An ordinary double. The exponent bits are not all ones, so this is a number, whatever the other bits hold.' },
  { label: '-2', hi: 0xc0000000, lo: 0, kind: 'number', reads: 'number -2', note: 'The sign bit is set and the exponent is 1024, so it is -2. Every finite double and both infinities have an exponent that isn’t all ones.' },
  { label: 'NaN (canonical)', hi: 0x7ff80000, lo: 0, kind: 'number', reads: 'number NaN', note: 'A real NaN: exponent all ones and the quiet bit set. The box bit is 0, so it still reads as a number. The VM must store every NaN in this one canonical form.' },
  { label: 'none', hi: BOX | 1, lo: 0, kind: 'boxed', reads: 'tag 1 = none', note: 'Set the box bit too, and the double is a NaN no arithmetic produces here. The low 16 bits of the high word are now free for a tag: 1 means none.' },
  { label: 'true', hi: BOX | 3, lo: 0, kind: 'boxed', reads: 'tag 3 = true', note: 'Tag 3 means true. Booleans and none need no payload at all.' },
  { label: 'object #7', hi: BOX | 4, lo: 7, kind: 'boxed', reads: 'tag 4, payload 7', note: 'Tag 4 means object. The low word carries a 32-bit payload: here an index into the VM’s object array. A C VM would put a 48-bit pointer there instead.' },
];

const bits = (n: number) => [...Array(32)].map((_, i) => (n >>> (31 - i)) & 1);
const field = (i: number) => (i === 0 ? 'sign' : i <= 11 ? 'exp' : i === 12 ? 'quiet' : i === 13 ? 'box' : i <= 15 ? 'unused' : 'tag');
const colour = (f: string) => ({ sign: tok('f4'), exp: tok('f1'), quiet: tok('f2'), box: tok('brand'), unused: tok('muted'), tag: tok('f3') } as Record<string, string>)[f];

export default function NanBoxSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const W = 11;
  const X0 = 24;
  const b = bits(st.hi);
  const boxed = (st.hi & BOX) === BOX;
  return (
    <StepFrame title="One 64-bit double, many kinds of value" steps={s} note={st.note}>
      <Svg w={400} h={190} title={`The high word of the double for ${st.label}, bit by bit, with the low word in hex`}>
        <T x={4} y={14} size={12} weight={700}>value: <tspan className="mono">{st.label}</tspan></T>
        <T x={4} y={34} size={11} weight={700} fill={tok('muted')}>HIGH WORD (bits 63 to 32)</T>
        {b.map((v, i) => {
          const f = field(i);
          const on = v === 1;
          return (
            <g key={i}>
              <rect x={X0 + i * W} y={44} width={W - 1.5} height={22} rx={2} fill={on ? colour(f) : tok('panel')} stroke={colour(f)} strokeWidth={1.2} opacity={f === 'unused' && !on ? 0.5 : 1} />
              <T x={X0 + i * W + (W - 1.5) / 2} y={55} size={10} mono anchor="middle" fill={on ? tok('paper') : tok('ink')}>{v}</T>
            </g>
          );
        })}
        {[
          ['sign', 0, 1], ['exponent', 1, 11], ['q', 12, 1], ['b', 13, 1], ['tag (16 bits)', 16, 16],
        ].map(([name, from, len]) => (
          <T key={name as string} x={X0 + (from as number) * W + ((len as number) * W) / 2} y={78} size={10} anchor="middle" fill={colour(field(from as number))}>{name}</T>
        ))}
        <T x={4} y={104} size={11} weight={700} fill={tok('muted')}>LOW WORD (bits 31 to 0)</T>
        <T x={X0} y={124} size={13} mono>0x{st.lo.toString(16).padStart(8, '0')}</T>
        <T x={4} y={150} size={12} mono>high word = 0x{(st.hi >>> 0).toString(16).padStart(8, '0')}</T>
        <T x={4} y={172} size={12} fill={boxed ? tok('brand') : tok('ink')}>
          {boxed ? 'quiet NaN + box bit: decode the tag → ' : 'not boxed: read it as a double → '}
          <tspan className="mono" fontWeight={700}>{st.reads}</tspan>
        </T>
      </Svg>
    </StepFrame>
  );
}
