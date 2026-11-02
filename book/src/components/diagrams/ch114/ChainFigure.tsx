// Chapter 114: method lookup walks up the superclass links. A Dog instance
// asked for speak finds Dog's own; asked for init it finds Animal's; asked
// for a name no class has, it reaches the end of the chain and fails.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const CLASSES = [
  { name: 'class Dog', methods: 'speak', y: 70 },
  { name: 'class Animal', methods: 'init, speak', y: 136 },
];

export default function ChainFigure() {
  return (
    <Svg w={400} h={226} title="A Dog instance points to class Dog, which points to its superclass Animal. Looking up speak stops at Dog, which has its own. Looking up init passes Dog and finds Animal's. Looking up fly passes both and fails: Dog has no property fly.">
      <Box x={6} y={8} w={150} h={40} stroke={tok('ink', 0.5)}>
        <T x={16} y={22} size={11} weight={700} fill={tok('muted')}>Dog instance</T>
        <T x={16} y={39} size={12.5} mono>name: "Rex"</T>
      </Box>
      {CLASSES.map((c) => (
        <Box key={c.name} x={6} y={c.y} w={150} h={42} fill={tok('brand', 0.08)} stroke={tok('brand')}>
          <T x={16} y={c.y + 14} size={11} weight={700} fill={tok('brand')}>{c.name}</T>
          <T x={16} y={c.y + 31} size={12.5} mono>{c.methods}</T>
        </Box>
      ))}
      <Arrow x1={60} y1={48} x2={60} y2={68} />
      <T x={66} y={60} size={11} fill={tok('muted')}>class</T>
      <Arrow x1={60} y1={112} x2={60} y2={134} />
      <T x={66} y={124} size={11} fill={tok('muted')}>superclass</T>
      <T x={16} y={198} size={12} mono fill={tok('muted')}>superclass: none</T>
      <Arrow x1={60} y1={178} x2={60} y2={188} />
      <T x={182} y={20} size={11} weight={700} fill={tok('muted')}>LOOKING UP A METHOD</T>
      <T x={182} y={44} size={12} mono>speak</T>
      <T x={232} y={44} size={11.5} fill={tok('safe')}>found in Dog: stop</T>
      <T x={182} y={70} size={12} mono>init</T>
      <T x={232} y={70} size={11.5}>not in Dog,</T>
      <T x={232} y={86} size={11.5} fill={tok('safe')}>found in Animal</T>
      <T x={182} y={112} size={12} mono>fly</T>
      <T x={232} y={112} size={11.5}>not in Dog, not in</T>
      <T x={232} y={128} size={11.5}>Animal, no more:</T>
      <T x={182} y={150} size={11.5} mono fill={tok('danger')}>Dog has no property</T>
      <T x={182} y={166} size={11.5} mono fill={tok('danger')}>'fly'</T>
    </Svg>
  );
}
