import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const LAYERS: [string, string][] = [
  ['main.js', 'read a file, run it'],
  ['interpreter.js', 'tree → values'],
  ['parser.js', 'tokens → tree'],
  ['scanner.js', 'text → tokens'],
  ['errors.js', 'the error classes'],
];

/** Modules in layers: every import points down, so there is no cycle. Beside it, a cycle. */
export default function Layers() {
  const H = 30;
  const G = 12;
  return (
    <Svg w={400} h={232} title="Left: five modules stacked from main.js at the top to errors.js at the bottom, each importing only modules below it. Right: two modules, scanner.js and parser.js, importing each other in a cycle, marked as a problem.">
      <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>IMPORTS POINT ONE WAY</T>
      {LAYERS.map(([name, job], k) => {
        const y = 22 + k * (H + G);
        return (
          <g key={name}>
            <Box x={4} y={y} w={232} h={H} r={5} stroke={k === 4 ? tok('safe') : tok('ink', 0.45)} fill={k === 4 ? tok('safe', 0.1) : tok('panel')}>
              <T x={14} y={y + H / 2} size={12} mono weight={700}>{name}</T>
              <T x={228} y={y + H / 2} size={11} anchor="end" fill={tok('muted')}>{job}</T>
            </Box>
            {k < 4 && <Arrow x1={60} y1={y + H + 1} x2={60} y2={y + H + G - 1} width={1.5} color={tok('brand')} />}
          </g>
        );
      })}
      <T x={8} y={226} size={11} fill={tok('muted')}>errors.js imports nothing; everyone may use it</T>
      <T x={274} y={12} size={11} weight={700} fill={tok('danger')}>A CYCLE</T>
      <Box x={274} y={40} w={122} h={H} r={5} stroke={tok('danger')} fill={tok('danger', 0.08)}>
        <T x={335} y={55} size={12} mono weight={700} anchor="middle">scanner.js</T>
      </Box>
      <Box x={274} y={124} w={122} h={H} r={5} stroke={tok('danger')} fill={tok('danger', 0.08)}>
        <T x={335} y={139} size={12} mono weight={700} anchor="middle">parser.js</T>
      </Box>
      <Arrow x1={310} y1={72} x2={310} y2={122} color={tok('danger')} width={1.5} />
      <Arrow x1={360} y1={122} x2={360} y2={72} color={tok('danger')} width={1.5} />
      <T x={335} y={172} size={11} anchor="middle" fill={tok('danger')}>each needs the</T>
      <T x={335} y={186} size={11} anchor="middle" fill={tok('danger')}>other to run first</T>
    </Svg>
  );
}
