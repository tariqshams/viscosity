import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 317-b: what a lazy accumulator leaves on the heap. Each pass of
// the loop wraps the previous thunk in a new one, so summing n numbers
// keeps n thunks alive, and forcing the last one recurses n deep.
const CELLS = ['() => prev() + 4', '() => prev() + 3', '() => prev() + 2', '() => prev() + 1', '() => 0'];

export default function ThunkChain() {
  return (
    <Svg w={400} h={236} title="A chain of five thunks: acc points to prev() + 4, which points to prev() + 3, and so on down to () => 0; beside it, the strict version is one number, 10">
      <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>LAZY acc AFTER 4 PASSES</T>
      <T x={8} y={34} size={12} mono weight={700}>acc</T>
      <Arrow x1={36} y1={34} x2={58} y2={34} />
      {CELLS.map((c, i) => {
        const y = 22 + i * 42;
        return (
          <g key={c}>
            <Box x={62} y={y} w={168} h={26} fill={tok('f3', 0.12)} stroke={tok('f3')}>
              <T x={72} y={y + 13} size={12} mono>{c}</T>
            </Box>
            {i < CELLS.length - 1 && <Arrow x1={146} y1={y + 26} x2={146} y2={y + 40} color={tok('f3')} />}
          </g>
        );
      })}
      <T x={262} y={12} size={11} weight={700} fill={tok('muted')}>STRICT acc</T>
      <Box x={262} y={22} w={60} h={26} fill={tok('safe', 0.12)} stroke={tok('safe')}>
        <T x={292} y={35} size={13} mono anchor="middle">10</T>
      </Box>
      <T x={262} y={80} size={11} fill={tok('muted')}>one number,</T>
      <T x={262} y={94} size={11} fill={tok('muted')}>updated in place</T>
      <T x={262} y={150} size={11} fill={tok('muted')}>n thunks on the heap;</T>
      <T x={262} y={164} size={11} fill={tok('muted')}>forcing them needs</T>
      <T x={262} y={178} size={11} fill={tok('muted')}>n stack frames</T>
    </Svg>
  );
}
