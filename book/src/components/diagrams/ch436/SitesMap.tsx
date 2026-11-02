import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 436: how a reason finds its place in the source. The planner turns
// bailout k of a collection into reason k ("unsafe: " + message);
// Collection::bail in engine/rust/crates/core/src/analysis.rs recorded each
// message's first site in bailout_sites, an IndexMap<String,
// Option<SourceRef>>. The two messages and lines are those of ps in this
// chapter's fr.js; a SourceRef also holds byte offsets, left out here.
const ROWS = [
  { reason: 'unsafe: line 7…', bail: 'line 7: …push', site: 'Some(7: ps[i])' },
  { reason: 'unsafe: line 9…', bail: 'line 9: …call', site: 'Some(9: ps[2])' },
];

export default function SitesMap() {
  return (
    <Svg w={400} h={190} title="Reason k is bailout k, and the bailout's message is the key to its first source position">
      <T x={6} y={12} size={11} weight={700} fill={tok('muted')}>cp.reasons[k]</T>
      <T x={142} y={12} size={11} weight={700} fill={tok('muted')}>c.bailouts[k]</T>
      <T x={274} y={12} size={11} weight={700} fill={tok('muted')}>bailout_sites</T>
      {ROWS.map((r, k) => {
        const y = 24 + k * 62;
        return (
          <g key={k}>
            <Box x={4} y={y} w={124} h={40} fill={tok('brand', 0.08)} stroke={tok('brand')}>
              <T x={10} y={y + 13} size={11} mono fill={tok('muted')}>{`k = ${k}`}</T>
              <T x={10} y={y + 29} size={11} mono>{r.reason}</T>
            </Box>
            <Arrow x1={130} y1={y + 20} x2={140} y2={y + 20} />
            <Box x={142} y={y} w={120} h={40} fill={tok('panel')}>
              <T x={148} y={y + 21} size={11} mono>{r.bail}</T>
            </Box>
            <Arrow x1={264} y1={y + 20} x2={272} y2={y + 20} />
            <Box x={274} y={y} w={122} h={40} fill={tok('safe', 0.1)} stroke={tok('safe')}>
              <T x={280} y={y + 13} size={11} mono fill={tok('muted')}>key: message</T>
              <T x={280} y={y + 29} size={11} mono>{r.site}</T>
            </Box>
          </g>
        );
      })}
      <T x={6} y={160} size={11} fill={tok('muted')}>same position k, so reason k finds its message; the message</T>
      <T x={6} y={178} size={11} fill={tok('muted')}>finds the site recorded the first time it was found</T>
    </Svg>
  );
}
