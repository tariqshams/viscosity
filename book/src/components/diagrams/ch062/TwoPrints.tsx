import type { ReactElement } from 'react';
import { Box, Svg, T, tok } from '../../viz/svg';

// Two different trees for the tokens 1 + 2 * 3, and how each one prints:
// written out plainly (infix, no brackets) they look the same; in Drip's
// bracketed, operator-first form they cannot be confused.
type Tr = string | [string, Tr, Tr];

const LEFT: Tr = ['+', '1', ['*', '2', '3']];
const RIGHT: Tr = ['*', ['+', '1', '2'], '3'];

const NW = 36;
const NH = 26;

function draw(t: Tr, x: number, y: number, spread: number, key = 'r'): ReactElement {
  if (typeof t === 'string') {
    return (
      <Box key={key} x={x - NW / 2} y={y - NH / 2} w={NW} h={NH} fill={tok('panel')} stroke={tok('ink', 0.45)}>
        <T x={x} y={y + 1} size={13} mono anchor="middle">{t}</T>
      </Box>
    );
  }
  const [op, l, r] = t;
  const dy = 46;
  return (
    <g key={key}>
      <line x1={x} y1={y + NH / 2} x2={x - spread} y2={y + dy - NH / 2} stroke={tok('ink', 0.45)} strokeWidth={1.4} />
      <line x1={x} y1={y + NH / 2} x2={x + spread} y2={y + dy - NH / 2} stroke={tok('ink', 0.45)} strokeWidth={1.4} />
      <Box x={x - NW / 2} y={y - NH / 2} w={NW} h={NH} r={13} fill={tok('brand', 0.14)} stroke={tok('brand')}>
        <T x={x} y={y + 1} size={14} mono anchor="middle" weight={700} fill={tok('brand')}>{op}</T>
      </Box>
      {draw(l, x - spread, y + dy, spread * 0.55, key + 'l')}
      {draw(r, x + spread, y + dy, spread * 0.55, key + 'r')}
    </g>
  );
}

export default function TwoPrints() {
  return (
    <Svg w={400} h={250} title="Two trees for 1 + 2 * 3. Left: plus at the root, with 2 times 3 as its right child. Right: times at the root, with 1 plus 2 as its left child. Printed plainly, both read 1 + 2 * 3. Printed Drip's way they read (+ 1 (* 2 3)) and (* (+ 1 2) 3).">
      <line x1={200} y1={4} x2={200} y2={246} stroke={tok('line')} strokeDasharray="4 4" />
      {draw(LEFT, 100, 22, 44, 'a')}
      {draw(RIGHT, 300, 22, 44, 'b')}
      <T x={8} y={168} size={11} weight={700} fill={tok('muted')}>PRINTED PLAINLY</T>
      <T x={100} y={188} size={13} mono anchor="middle" fill={tok('danger')}>1 + 2 * 3</T>
      <T x={300} y={188} size={13} mono anchor="middle" fill={tok('danger')}>1 + 2 * 3</T>
      <T x={8} y={212} size={11} weight={700} fill={tok('muted')}>PRINTED DRIP’S WAY</T>
      <T x={100} y={232} size={13} mono anchor="middle" fill={tok('safe')} weight={700}>(+ 1 (* 2 3))</T>
      <T x={300} y={232} size={13} mono anchor="middle" fill={tok('safe')} weight={700}>(* (+ 1 2) 3)</T>
    </Svg>
  );
}
