// Chapter 343: what each kind of variable costs at run time in drip-rs
// (book/companion/rust/src/vm.rs). load.global reads a two-byte constant
// index, finds the interned name in the chunk's constants, and probes the
// VM's globals Table with it; load.local reads a one-byte slot and adds
// the frame's base, self.slots, to index the stack directly. The
// operands match `drip-rs --disassemble` for the chapter's listings.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

export default function TwoLookups() {
  return (
    <Svg w={400} h={250} title="A global is found by name in a table; a local is a slot number added to the frame's base">
      <T x={8} y={12} size={12} weight={700} fill={tok('brand')}>global: by name</T>
      <Box x={8} y={24} w={176} h={28} r={3} fill={tok('brand', 0.12)} stroke={tok('brand')}>
        <T x={16} y={38} size={12} mono>load.global 3 'n'</T>
      </Box>
      <Box x={8} y={76} w={176} h={28} r={3} fill={tok('panel')} stroke={tok('line')}>
        <T x={16} y={90} size={12} mono>constants[3]: "n"</T>
      </Box>
      <Arrow x1={96} y1={52} x2={96} y2={74} color={tok('brand')} />
      <Box x={8} y={128} w={176} h={52} r={3} fill={tok('panel')} stroke={tok('line')}>
        <T x={16} y={144} size={12} mono>globals: Table</T>
        <T x={16} y={164} size={11} fill={tok('muted')}>probe from hash &amp; mask</T>
      </Box>
      <Arrow x1={96} y1={104} x2={96} y2={126} color={tok('brand')} />
      <T x={8} y={204} size={11} fill={tok('muted')}>missing name: runtime error</T>
      <T x={8} y={220} size={11} fill={tok('muted')}>undefined variable 'n'</T>

      <T x={216} y={12} size={12} weight={700} fill={tok('accent')}>local: by slot</T>
      <Box x={216} y={24} w={176} h={28} r={3} fill={tok('accent', 0.12)} stroke={tok('accent')}>
        <T x={224} y={38} size={12} mono>load.local 1</T>
      </Box>
      <Box x={216} y={76} w={176} h={28} r={3} fill={tok('panel')} stroke={tok('line')}>
        <T x={224} y={90} size={12} mono>self.slots + 1</T>
      </Box>
      <Arrow x1={304} y1={52} x2={304} y2={74} color={tok('accent')} />
      {['slot 0', 'slot 1: a', 'slot 2: b'].map((v, k) => (
        <Box key={k} x={216} y={128 + k * 26} w={140} h={22} r={3}
          fill={k === 1 ? tok('accent', 0.16) : tok('panel')} stroke={k === 1 ? tok('accent') : tok('line')}>
          <T x={224} y={139 + k * 26} size={12} mono>{v}</T>
        </Box>
      ))}
      <Arrow x1={376} y1={104} x2={358} y2={165} color={tok('accent')} />
      <T x={216} y={220} size={11} fill={tok('muted')}>no names left at run time</T>
    </Svg>
  );
}
