import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// The strict family in TypeScript 5.9 (tsc --help --all: "default: false,
// unless strict is set"). The three the chapter shows are highlighted.
const FLAGS: [string, boolean][] = [
  ['noImplicitAny', true],
  ['strictNullChecks', true],
  ['useUnknownInCatchVariables', true],
  ['strictFunctionTypes', false],
  ['strictBindCallApply', false],
  ['strictPropertyInitialization', false],
  ['strictBuiltinIteratorReturn', false],
  ['noImplicitThis', false],
  ['alwaysStrict', false],
];

/** One switch, nine checks: "strict": true turns on the whole family. */
export default function StrictFamily() {
  const top = 22;
  const gap = 21;
  return (
    <Svg w={400} h={226} title="The setting strict: true, with arrows to the nine checks it turns on: noImplicitAny, strictNullChecks, useUnknownInCatchVariables, strictFunctionTypes, strictBindCallApply, strictPropertyInitialization, strictBuiltinIteratorReturn, noImplicitThis and alwaysStrict. The first three are highlighted.">
      <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>ONE SWITCH</T>
      <Box x={4} y={92} w={112} h={34} stroke={tok('brand')} fill={tok('brand', 0.12)}>
        <T x={60} y={109.5} size={12} mono weight={700} anchor="middle">"strict": true</T>
      </Box>
      <T x={164} y={12} size={11} weight={700} fill={tok('muted')}>TURNS ON ALL OF THESE</T>
      {FLAGS.map(([name, shown], k) => {
        const y = top + k * gap;
        return (
          <g key={name}>
            <Arrow x1={118} y1={109} x2={160} y2={y + 9} width={1} color={tok('ink', shown ? 0.55 : 0.25)} />
            <Box x={162} y={y} w={234} h={18} r={3} stroke={shown ? tok('accent') : tok('line')} fill={shown ? tok('accent', 0.12) : 'transparent'}>
              <T x={170} y={y + 9.5} size={11} mono weight={shown ? 700 : undefined}>{name}</T>
            </Box>
          </g>
        );
      })}
      <T x={8} y={220} size={11} fill={tok('muted')}>Highlighted: the three shown here. Each can be turned off alone.</T>
    </Svg>
  );
}
