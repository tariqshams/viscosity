import type { ReactElement } from 'react';
import { Box, Svg, T, tok } from '../../viz/svg';

/** A small binary tree: either a leaf value or [op, left, right]. */
type Tr = string | [string, Tr, Tr];

const PAIRS: Record<'prec' | 'assoc', { src: string; good: Tr; bad: Tr; goodV: string; badV: string }> = {
  prec: { src: '1 + 2 * 3', good: ['+', '1', ['*', '2', '3']], bad: ['*', ['+', '1', '2'], '3'], goodV: '1 + 6 = 7', badV: '3 × 3 = 9' },
  assoc: { src: '1 - 2 - 3', good: ['-', ['-', '1', '2'], '3'], bad: ['-', '1', ['-', '2', '3']], goodV: '-1 - 3 = -4', badV: '1 - (-1) = 2' },
};

const NW = 40;
const NH = 28;

function draw(t: Tr, x: number, y: number, spread: number, key = 'r'): ReactElement {
  if (typeof t === 'string') {
    return (
      <Box key={key} x={x - NW / 2} y={y - NH / 2} w={NW} h={NH} fill={tok('panel')} stroke={tok('ink', 0.45)}>
        <T x={x} y={y + 1} size={14} mono anchor="middle">{t}</T>
      </Box>
    );
  }
  const [op, l, r] = t;
  const dy = 52;
  return (
    <g key={key}>
      <line x1={x} y1={y + NH / 2} x2={x - spread} y2={y + dy - NH / 2} stroke={tok('ink', 0.45)} strokeWidth={1.4} />
      <line x1={x} y1={y + NH / 2} x2={x + spread} y2={y + dy - NH / 2} stroke={tok('ink', 0.45)} strokeWidth={1.4} />
      <Box x={x - NW / 2} y={y - NH / 2} w={NW} h={NH} r={14} fill={tok('brand', 0.14)} stroke={tok('brand')}>
        <T x={x} y={y + 1} size={15} mono anchor="middle" weight={700} fill={tok('brand')}>{op}</T>
      </Box>
      {draw(l, x - spread, y + dy, spread * 0.55, key + 'l')}
      {draw(r, x + spread, y + dy, spread * 0.55, key + 'r')}
    </g>
  );
}

/** Two possible trees for one expression: the one Drip builds, and the other. */
export default function TwoTrees({ which }: { which: 'prec' | 'assoc' }) {
  const p = PAIRS[which];
  return (
    <Svg w={400} h={214} title={`Two possible trees for ${p.src}. Left, the tree Drip builds, which evaluates as ${p.goodV}. Right, the other grouping, which evaluates as ${p.badV}.`}>
      <T x={100} y={12} size={11} weight={700} anchor="middle" fill={tok('safe')}>✓ DRIP BUILDS THIS</T>
      <T x={300} y={12} size={11} weight={700} anchor="middle" fill={tok('danger')}>✗ NOT THIS</T>
      <line x1={200} y1={4} x2={200} y2={206} stroke={tok('line')} strokeDasharray="4 4" />
      {draw(p.good, 100, 44, 46, 'g')}
      {draw(p.bad, 300, 44, 46, 'b')}
      <T x={100} y={198} size={13} mono anchor="middle" fill={tok('safe')} weight={700}>{p.goodV}</T>
      <T x={300} y={198} size={13} mono anchor="middle" fill={tok('danger')}>{p.badV}</T>
    </Svg>
  );
}
