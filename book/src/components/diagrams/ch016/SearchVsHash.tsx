import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const NAMES = ['red', 'blue', 'gold', 'teal', 'jade', 'pink', 'sky', 'ink'];
const BUCKETS = [['red', 'jade'], ['blue', 'sky'], ['teal', 'pink'], ['gold', 'ink']];
const FIND = 'pink';

/** Finding 'pink': six checks in an array, two in a hash table. */
export default function SearchVsHash() {
  const at = NAMES.indexOf(FIND);
  return (
    <Svg w={400} h={238} title="Top: an array of eight names; finding pink means checking red, blue, gold, teal and jade first, six checks in all. Bottom: the same names spread over four buckets; the hash of pink says bucket 2, which holds teal and pink, so only two checks are needed.">
      <T x={6} y={12} size={11} weight={700} fill={tok('muted')}>AN ARRAY: CHECK ONE BY ONE</T>
      {NAMES.map((n, k) => {
        const x = 6 + k * 49;
        const checked = k <= at;
        const hit = k === at;
        return (
          <Box key={n} x={x} y={22} w={44} h={30} fill={hit ? tok('safe', 0.16) : checked ? tok('danger', 0.08) : tok('panel')} stroke={hit ? tok('safe') : checked ? tok('danger') : tok('ink', 0.4)}>
            <T x={x + 22} y={37} size={12} mono anchor="middle">{n}</T>
          </Box>
        );
      })}
      <T x={6} y={68} size={12} fill={tok('danger')} weight={700}>{at + 1} checks to find '{FIND}' (a million names: up to a million)</T>
      <T x={6} y={96} size={11} weight={700} fill={tok('muted')}>A HASH TABLE: WORK OUT THE BUCKET, CHECK ONLY THERE</T>
      <T x={6} y={116} size={12} mono>hash('{FIND}') → bucket 2</T>
      <Arrow x1={182} y1={122} x2={204} y2={190} color={tok('brand')} />
      {BUCKETS.map((b, i) => {
        const y = 126 + i * 27;
        const hot = i === 2;
        return (
          <g key={i}>
            <Box x={210} y={y} w={28} h={23} fill={hot ? tok('brand', 0.18) : tok('panel')} stroke={hot ? tok('brand') : tok('ink', 0.4)}>
              <T x={224} y={y + 11.5} size={12} mono weight={700} anchor="middle">{i}</T>
            </Box>
            {b.map((n, j) => {
              const x = 246 + j * 74;
              const seen = hot;
              const hit = hot && n === FIND;
              return (
                <Box key={n} x={x} y={y} w={68} h={23} fill={hit ? tok('safe', 0.16) : seen ? tok('danger', 0.08) : tok('accent', 0.08)} stroke={hit ? tok('safe') : seen ? tok('danger') : tok('accent')}>
                  <T x={x + 34} y={y + 11.5} size={12} mono anchor="middle">{n}</T>
                </Box>
              );
            })}
          </g>
        );
      })}
      <T x={6} y={150} size={12} fill={tok('safe')} weight={700}>2 checks, however</T>
      <T x={6} y={166} size={12} fill={tok('safe')} weight={700}>big the table grows</T>
      <T x={6} y={182} size={11} fill={tok('muted')}>(if the keys spread evenly)</T>
    </Svg>
  );
}
