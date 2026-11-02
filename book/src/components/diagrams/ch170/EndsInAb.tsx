// An NFA for "any a's and b's, ending in ab", next to the DFA for the
// same language: the NFA guesses where the final "ab" begins.
import { Svg, T, tok } from '../../viz/svg';
import { Fsm } from './Fsm';

export default function EndsInAb() {
  return (
    <Svg w={400} h={300} title="An NFA and a DFA that both accept strings of a and b ending in ab">
      <T x={8} y={14} size={12} weight={700} fill={tok('muted')}>NFA: guess where the last “ab” starts</T>
      <Fsm
        states={[{ id: '0', x: 70, y: 82 }, { id: '1', x: 190, y: 82 }, { id: '2', x: 310, y: 82, accept: true }]}
        edges={[
          { from: '0', to: '0', label: 'a, b', loop: 'up' },
          { from: '0', to: '1', label: 'a' },
          { from: '1', to: '2', label: 'b' },
        ]}
        start="0"
      />
      <T x={8} y={136} size={12} weight={700} fill={tok('muted')}>DFA: no guessing, but more arrows to get right</T>
      <Fsm
        states={[{ id: 'A', x: 80, y: 240 }, { id: 'B', x: 300, y: 240 }, { id: 'C', x: 190, y: 172, accept: true }]}
        edges={[
          { from: 'A', to: 'A', label: 'b', loop: 'down' },
          { from: 'A', to: 'B', label: 'a' },
          { from: 'B', to: 'B', label: 'a', loop: 'down' },
          { from: 'B', to: 'C', label: 'b', bend: 0.35, dx: 14 },
          { from: 'C', to: 'B', label: 'a', bend: 0.35, dx: -8, dy: 22 },
          { from: 'C', to: 'A', label: 'b' },
        ]}
        start="A"
      />
    </Svg>
  );
}
