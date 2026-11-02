// Chapter 107: every collection Viscosity keeps as an array of objects in
// the differential corpus (40 files; 18 of them keep at least one), sorted
// by why. Computed for this chapter by compiling each corpus file in the
// mode its header names and reading plan.collections.
import { Box, Svg, T, tok } from '../../viz/svg';

const GROUPS = [
  {
    title: 'UNSAFE', sub: 'a bailout', color: 'danger',
    items: ['aliasing_identity: ps', 'aliasing_identity: keep', 'closure_alias', 'comma_field_name', 'escapes_log', 'interproc_mixed: a', 'interproc_mixed: b', 'map_method', 'reassigned', 'record_shared', 'shape_mismatch', 'string_index', 'throw_from_loop'],
  },
  {
    title: 'NOT WORTH IT', sub: 'the cost model', color: 'brand',
    items: ['all_generic', 'no_loops', 'param_unknown', 'small_auto'],
  },
  {
    title: 'YOU ASKED', sub: 'annotation or opt-in', color: 'muted',
    items: ['aosoa_bad_block', 'opt_in_mode', 'trailing_annotation'],
  },
];

export default function RefusalTally() {
  return (
    <Svg w={400} h={300} title="Twenty collections kept as arrays of objects in the corpus: thirteen because their safety cannot be proved, four because a new layout would not pay off, and three because an annotation or opt-in mode said so.">
      <T x={8} y={276} size={11} weight={700} fill={tok('danger')}>13 bailouts</T>
      {GROUPS.map((g, k) => {
        const x = k === 0 ? 4 : 210;
        const y0 = k === 2 ? 132 : 4;
        return (
          <g key={g.title}>
            <Box x={x} y={y0} w={k === 0 ? 196 : 186} h={36 + g.items.length * 17} stroke={tok(g.color)} fill={tok(g.color, 0.08)}>
              <T x={x + 8} y={y0 + 14} size={11} weight={700} fill={tok(g.color)}>{g.title}</T>
              <T x={x + 8} y={y0 + 28} size={11} fill={tok('muted')}>{g.sub}</T>
              {g.items.map((it, j) => (
                <T key={it} x={x + 8} y={y0 + 46 + j * 17} size={11} mono>{it}</T>
              ))}
            </Box>
          </g>
        );
      })}
      <T x={210} y={276} size={11} fill={tok('muted')}>4 + 3 safe, but kept</T>
      <T x={8} y={294} size={11} fill={tok('muted')}>20 collections kept, in 18 of the 40 corpus files</T>
    </Svg>
  );
}
