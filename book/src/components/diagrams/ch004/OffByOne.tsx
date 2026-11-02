import { Box, Svg, T, tok } from '../../viz/svg';

/** Which indexes two loop tests visit, for an array of length 3. */
export default function OffByOne() {
  const row = (y: number, label: string, upto: number, bad: boolean) => (
    <g>
      <T x={8} y={y - 12} size={13} mono weight={700} fill={bad ? tok('danger') : tok('safe')}>{label}</T>
      {Array.from({ length: 4 }, (_, k) => {
        const x = 8 + k * 98;
        const visited = k <= upto;
        const ghost = k === 3;
        const colour = ghost ? (visited ? tok('danger') : tok('line')) : tok('safe');
        return (
          <g key={k}>
            <Box x={x} y={y} w={90} h={36} dash={ghost} fill={visited && !ghost ? tok('safe', 0.12) : visited ? tok('danger', 0.1) : 'transparent'} stroke={colour}>
              <T x={x + 45} y={y + 18} size={ghost ? 12 : 14} mono anchor="middle" fill={ghost ? colour : undefined}>
                {ghost ? (visited ? 'undefined' : 'no slot') : `i = ${k}`}
              </T>
            </Box>
          </g>
        );
      })}
    </g>
  );
  return (
    <Svg w={400} h={170} title="For an array of length 3, the test i < xs.length visits i = 0, 1 and 2; the test i <= xs.length also visits i = 3, where there is no slot, and reads undefined.">
      {row(30, 'i < xs.length   visits 0, 1, 2', 2, false)}
      {row(104, 'i <= xs.length  one step too far', 3, true)}
      <T x={200} y={160} size={11} anchor="middle" fill={tok('muted')}>xs = [4, 8, 15], so length is 3 and the last index is 2</T>
    </Svg>
  );
}
