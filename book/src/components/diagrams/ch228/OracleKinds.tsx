// Chapter 228: four ways to know the right answer without working it out
// by hand. Golden: compare with a stored answer. Differential: compare two
// implementations. Metamorphic: change the input in a way that must not
// change the answer. Round trip: an operation and its inverse.
import type { ReactNode } from 'react';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

function panel(x: number, y: number, title: string, c: string, children: ReactNode) {
  return (
    <g>
      <Box x={x} y={y} w={190} h={112} fill={tok(c, 0.08)} stroke={tok(c)} />
      <T x={x + 10} y={y + 14} size={12} weight={700} fill={tok(c)}>{title}</T>
      {children}
    </g>
  );
}

const pill = (x: number, y: number, w: number, label: string) => (
  <Box x={x} y={y} w={w} h={22} fill={tok('panel')} stroke={tok('line')}>
    <T x={x + w / 2} y={y + 11} size={11} mono anchor="middle">{label}</T>
  </Box>
);

export default function OracleKinds() {
  return (
    <Svg w={400} h={248} title="Four test oracles: golden files, differential, metamorphic and round trip">
      {panel(6, 6, 'golden', 'brand', (
        <g>
          {pill(16, 30, 70, 'program')}
          <Arrow x1={86} y1={41} x2={110} y2={41} />
          {pill(112, 30, 74, 'output')}
          {pill(112, 80, 74, 'stored')}
          <T x={149} y={66} size={13} anchor="middle" weight={700}>=?</T>
        </g>
      ))}
      {panel(204, 6, 'differential', 'accent', (
        <g>
          {pill(214, 44, 54, 'input')}
          <Arrow x1={268} y1={50} x2={290} y2={36} />
          <Arrow x1={268} y1={60} x2={290} y2={82} />
          {pill(292, 26, 92, 'impl A')}
          {pill(292, 74, 92, 'impl B')}
          <T x={338} y={62} size={13} anchor="middle" weight={700}>=?</T>
        </g>
      ))}
      {panel(6, 128, 'metamorphic', 'safe', (
        <g>
          {pill(16, 152, 60, 'P')}
          {pill(16, 202, 60, "P'")}
          <Arrow x1={46} y1={174} x2={46} y2={200} />
          <T x={54} y={188} size={10.5} fill={tok('muted')}>change</T>
          <Arrow x1={76} y1={163} x2={110} y2={163} />
          <Arrow x1={76} y1={213} x2={110} y2={213} />
          {pill(112, 152, 74, 'out')}
          {pill(112, 202, 74, 'out')}
          <T x={149} y={188} size={13} anchor="middle" weight={700}>=?</T>
        </g>
      ))}
      {panel(204, 128, 'round trip', 'warn', (
        <g>
          {pill(214, 156, 50, 'x')}
          <Arrow x1={264} y1={167} x2={292} y2={167} />
          {pill(294, 156, 90, 'print(x)')}
          <Arrow x1={338} y1={178} x2={338} y2={200} />
          {pill(294, 202, 90, 'parse(...)')}
          <T x={250} y={213} size={13} anchor="middle" weight={700}>=? x</T>
        </g>
      ))}
    </Svg>
  );
}
