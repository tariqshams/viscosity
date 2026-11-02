import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 165: a cache keyed by a hash of the lockfile, as
// actions/setup-node does for npm's download cache (its README: the hash
// of the dependency file is part of the cache key). The same lockfile
// gives the same key and finds the saved cache; any change to it gives a
// new key, a miss, and a fresh download that is then saved under the new
// key. The hash values are made up.
const ROWS: { push: string; lock: string; key: string; hit: boolean }[] = [
  { push: 'push 1', lock: 'lock A', key: 'node-9f3c', hit: false },
  { push: 'push 2', lock: 'lock A', key: 'node-9f3c', hit: true },
  { push: 'push 3', lock: 'lock B', key: 'node-41d7', hit: false },
  { push: 'push 4', lock: 'lock B', key: 'node-41d7', hit: true },
];

export default function CacheFigure() {
  const grey = tok('ink', 0.45);
  return (
    <Svg w={400} h={214} title="Four pushes: the same lockfile finds its cache, a changed lockfile misses">
      <T x={10} y={14} size={12} weight={700} fill={tok('muted')}>run</T>
      <T x={84} y={14} size={12} weight={700} fill={tok('muted')}>lockfile</T>
      <T x={186} y={14} size={12} weight={700} fill={tok('muted')}>key = hash</T>
      <T x={312} y={14} size={12} weight={700} fill={tok('muted')}>cache</T>
      {ROWS.map((r, k) => {
        const y = 28 + k * 44;
        return (
          <g key={r.push}>
            <T x={10} y={y + 14} size={12} mono>{r.push}</T>
            <Box x={84} y={y} w={70} h={28} r={3} fill={r.lock === 'lock B' ? tok('accent', 0.15) : tok('panel')} stroke={r.lock === 'lock B' ? tok('accent') : tok('line')}>
              <T x={119} y={y + 14} size={12} mono anchor="middle">{r.lock}</T>
            </Box>
            <Arrow x1={156} y1={y + 14} x2={182} y2={y + 14} color={grey} width={1.5} />
            <Box x={186} y={y} w={96} h={28} r={3} fill={tok('panel')} stroke={tok('line')}>
              <T x={234} y={y + 14} size={12} mono anchor="middle">{r.key}</T>
            </Box>
            <Arrow x1={284} y1={y + 14} x2={308} y2={y + 14} color={grey} width={1.5} />
            <Box x={312} y={y} w={78} h={28} r={3} fill={r.hit ? tok('safe', 0.15) : tok('warn', 0.18)} stroke={r.hit ? tok('safe') : tok('warn')}>
              <T x={351} y={y + 14} size={12} anchor="middle">{r.hit ? 'hit' : 'miss: save'}</T>
            </Box>
          </g>
        );
      })}
      <T x={10} y={206} size={11} fill={tok('muted')}>hash values made up; lock B adds one package</T>
    </Svg>
  );
}
