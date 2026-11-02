import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// V8's four tiers as a ladder. Facts from the V8 blog posts on Ignition
// (2016), Sparkplug (2021) and Maglev (2023, which gives the "about 10x"
// compile-speed steps); the last column is what `node --v8-options` and
// %OptimizeMaglevOnNextCall reported in Node v22.23.4 (V8 12.4).
const ROWS = [
  { name: 'TurboFan', what: 'optimizing compiler: best code', speed: 'slowest to compile', node: 'on' },
  { name: 'Maglev', what: 'quick optimizing compiler', speed: '~10× faster than TurboFan', node: 'off' },
  { name: 'Sparkplug', what: 'bytecode → machine code, one pass', speed: '~10× faster than Maglev', node: 'on' },
  { name: 'Ignition', what: 'interprets the bytecode', speed: 'no compile step', node: 'on' },
];

export default function TierLadder() {
  return (
    <Svg w={400} h={232} title="A ladder of four tiers. From the bottom: Ignition interprets bytecode; Sparkplug turns bytecode into machine code in one pass; Maglev is a quick optimizing compiler; TurboFan is the slow optimizing compiler that makes the best code. Arrows on the side say code gets faster going up, and compiling gets cheaper going down. In Node 22, Maglev is off.">
      <T x={60} y={12} size={11} weight={700} fill={tok('muted')}>TIER</T>
      <T x={372} y={12} size={11} weight={700} fill={tok('muted')} anchor="middle">NODE 22</T>
      {ROWS.map((r, k) => {
        const y = 22 + k * 50;
        const off = r.node === 'off';
        return (
          <Box key={r.name} x={30} y={y} w={310} h={42} r={5} fill={off ? tok('panel') : tok('brand', 0.06 + 0.04 * (3 - k))} stroke={off ? tok('line') : tok('brand')} dash={off}>
            <T x={40} y={y + 13} size={13} weight={700} fill={off ? tok('muted') : tok('ink')}>{r.name}</T>
            <T x={128} y={y + 13} size={11} fill={tok('ink')}>{r.what}</T>
            <T x={40} y={y + 31} size={11} fill={tok('muted')}>{r.speed}</T>
            <T x={372} y={y + 21} size={12} weight={700} anchor="middle" fill={off ? tok('danger') : tok('safe')}>{r.node}</T>
          </Box>
        );
      })}
      <Arrow x1={14} y1={210} x2={14} y2={28} color={tok('safe')} />
      <T x={8} y={222} size={11} fill={tok('safe')}>faster code going up; cheaper to start going down</T>
    </Svg>
  );
}
