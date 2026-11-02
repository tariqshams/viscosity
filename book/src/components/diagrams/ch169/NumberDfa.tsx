// The DFA for Drip numbers, drawn as a state diagram beside its table.
import { Box, Svg, T, tok } from '../../viz/svg';
import { Fsm, type Ed, type St } from './Fsm';

export const NUM_STATES: St[] = [
  { id: 'S', x: 44, y: 70 },
  { id: 'I', x: 140, y: 70, accept: true },
  { id: 'D', x: 236, y: 70 },
  { id: 'F', x: 332, y: 70, accept: true },
];
export const NUM_EDGES: Ed[] = [
  { from: 'S', to: 'I', label: 'digit' },
  { from: 'I', to: 'I', label: 'digit', loop: 'up' },
  { from: 'I', to: 'D', label: '.' },
  { from: 'D', to: 'F', label: 'digit' },
  { from: 'F', to: 'F', label: 'digit', loop: 'up' },
];
export const ROWS: [string, string, string][] = [
  ['S', 'I', '–'],
  ['I', 'I', 'D'],
  ['D', 'F', '–'],
  ['F', 'F', '–'],
];

export function NumTable({ y, hot, col }: { y: number; hot?: string; col?: 1 | 2 }) {
  const xs = [120, 210, 290];
  return (
    <g>
      <T x={xs[0]} y={y} size={11} weight={700} fill={tok('muted')} anchor="middle">state</T>
      <T x={xs[1]} y={y} size={11} weight={700} fill={tok('muted')} anchor="middle">digit</T>
      <T x={xs[2]} y={y} size={11} weight={700} fill={tok('muted')} anchor="middle">dot</T>
      {ROWS.map((r, k) => {
        const yy = y + 20 + k * 20;
        const lit = r[0] === hot;
        return (
          <g key={r[0]}>
            {lit && <rect x={86} y={yy - 9} width={240} height={18} rx={3} fill={tok('brand', 0.14)} />}
            {r.map((c, j) => (
              <T key={j} x={xs[j]} y={yy} size={12} mono anchor="middle" weight={lit && (j === 0 || j === col) ? 700 : 400}
                fill={c === '–' ? tok('muted') : lit && j === col ? tok('brand') : undefined}>{c}{j === 0 && (r[0] === 'I' || r[0] === 'F') ? ' ✓' : ''}</T>
            ))}
          </g>
        );
      })}
    </g>
  );
}

export default function NumberDfa() {
  return (
    <Svg w={400} h={226} title="A DFA for Drip numbers with states S, I, D and F, and the same machine as a table">
      <Fsm states={NUM_STATES} edges={NUM_EDGES} start="S" />
      <T x={44} y={102} size={10} anchor="middle" fill={tok('muted')}>start</T>
      <T x={140} y={102} size={10} anchor="middle" fill={tok('muted')}>whole part</T>
      <T x={236} y={102} size={10} anchor="middle" fill={tok('muted')}>just a dot</T>
      <T x={332} y={102} size={10} anchor="middle" fill={tok('muted')}>fraction</T>
      <Box x={84} y={118} w={244} h={104} fill="transparent" stroke={tok('line')} />
      <NumTable y={132} />
    </Svg>
  );
}
