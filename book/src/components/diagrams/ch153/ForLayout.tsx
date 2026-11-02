// Chapter 153: the shape of a compiled for-range loop, from the
// companion's real disassembly of
//   for i in 0..3 { print i; }
// with its two hidden locals, its jumps, and where break and continue land.
import { Arrow, Svg, T, tok } from '../../viz/svg';

/** [offset, instruction, side note] */
const ROWS: [string, string, string][] = [
  ['0000', 'const 0', 'start, into slot 1'],
  ['0003', 'const 3', 'end, into slot 2'],
  ['0006', 'iter.range', 'both numbers?'],
  ['0007', 'load.local 1', 'top: counter'],
  ['0009', 'load.local 2', '< end ?'],
  ['0011', 'lt', ''],
  ['0012', 'jump.unless -> 26', ''],
  ['0015', 'load.local 1', 'i = counter (slot 3)'],
  ['0017', 'load.local 3', 'the body:'],
  ['0019', 'print', 'print i'],
  ['0020', 'pop', 'i is gone ← continue'],
  ['0021', 'inc.local 1', 'counter + 1'],
  ['0023', 'loop -> 7', ''],
  ['0026', 'pop', 'drop end ← break'],
  ['0027', 'pop', 'drop counter'],
];

const TOP = 34;
const RH = 15;
const y = (i: number) => TOP + i * RH;

export default function ForLayout() {
  return (
    <Svg w={400} h={280} title="The fifteen instructions of a for-range loop. The start and end values become hidden locals in slots 1 and 2. At the top, counter < end is tested; jump.unless at 12 leaves for offset 26. The loop variable i is a fresh local in slot 3 each time round. After the body, i is popped, the counter is incremented, and loop at 23 goes back to offset 7. Continue lands on the pop at 20; break lands on 26, where the hidden locals are popped.">
      <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>for i in 0..3 {'{'} print i; {'}'}</T>
      {ROWS.map(([off, ins, note], i) => {
        const hot = ins.startsWith('jump') || ins.startsWith('loop');
        return (
          <g key={off}>
            <T x={8} y={y(i)} size={11} mono fill={tok('muted')}>{off}</T>
            <T x={46} y={y(i)} size={11.5} mono weight={hot ? 700 : 400} fill={hot ? tok('brand') : tok('ink')}>{ins}</T>
            <T x={236} y={y(i)} size={11} fill={note.includes('←') ? tok('ink') : tok('muted')}>{note}</T>
          </g>
        );
      })}
      <Arrow x1={206} y1={y(6)} x2={206} y2={y(13) - 5} bend={-0.3} color={tok('brand')} />
      <Arrow x1={184} y1={y(12)} x2={184} y2={y(3) + 5} bend={0.3} color={tok('accent')} />
      <T x={8} y={250} size={11} fill={tok('brand')}>right arrow: jump.unless exits</T>
      <T x={210} y={250} size={11} fill={tok('accent')}>left arrow: loop goes back</T>
      <T x={8} y={268} size={11} fill={tok('muted')}>Slots: 1 = counter, 2 = end (hidden), 3 = i.</T>
    </Svg>
  );
}
