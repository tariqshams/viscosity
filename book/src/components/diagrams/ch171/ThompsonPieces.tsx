// Thompson's construction: one small NFA for each kind of regular
// expression. Dashed boxes are the machines already built for the parts.
import { Box, Svg, T, tok } from '../../viz/svg';
import { Fsm } from './Fsm';

function Part({ x, y, w, name }: { x: number; y: number; w: number; name: string }) {
  return (
    <g>
      <Box x={x} y={y - 24} w={w} h={48} dash fill={tok('accent', 0.06)} stroke={tok('accent', 0.7)} />
      <T x={x + w / 2} y={y - 31} size={11} mono anchor="middle" fill={tok('accent')}>{name}</T>
    </g>
  );
}

export default function ThompsonPieces() {
  return (
    <Svg w={400} h={470} title="The five rules of Thompson's construction: a character, epsilon, concatenation, alternation and star">
      <T x={8} y={14} size={12} weight={700} fill={tok('muted')}>a</T>
      <Fsm states={[{ id: 's', x: 50, y: 46 }, { id: 'f', x: 140, y: 46, accept: true }]} edges={[{ from: 's', to: 'f', label: 'a' }]} start="s" />
      <T x={208} y={14} size={12} weight={700} fill={tok('muted')}>ε</T>
      <Fsm states={[{ id: 's', x: 250, y: 46 }, { id: 'f', x: 340, y: 46, accept: true }]} edges={[{ from: 's', to: 'f', label: 'ε' }]} start="s" />

      <T x={8} y={92} size={12} weight={700} fill={tok('muted')}>rs (then)</T>
      <Part x={28} y={136} w={140} name="N(r)" />
      <Part x={226} y={136} w={140} name="N(s)" />
      <Fsm states={[{ id: 'r0', x: 56, y: 136, label: '' }, { id: 'r1', x: 140, y: 136, label: '' }, { id: 's0', x: 254, y: 136, label: '' }, { id: 's1', x: 338, y: 136, label: '', accept: true }]}
        edges={[{ from: 'r1', to: 's0', label: 'ε' }]} start="r0" />
      <T x={98} y={137} size={11} anchor="middle" fill={tok('muted')}>…</T>
      <T x={296} y={137} size={11} anchor="middle" fill={tok('muted')}>…</T>

      <T x={8} y={182} size={12} weight={700} fill={tok('muted')}>r|s (or)</T>
      <Part x={110} y={222} w={140} name="N(r)" />
      <Part x={110} y={292} w={140} name="N(s)" />
      <Fsm
        states={[{ id: 's', x: 50, y: 257 }, { id: 'a0', x: 138, y: 222, label: '' }, { id: 'a1', x: 222, y: 222, label: '' }, { id: 'b0', x: 138, y: 292, label: '' }, { id: 'b1', x: 222, y: 292, label: '' }, { id: 'f', x: 320, y: 257, accept: true }]}
        edges={[{ from: 's', to: 'a0', label: 'ε' }, { from: 's', to: 'b0', label: 'ε' }, { from: 'a1', to: 'f', label: 'ε' }, { from: 'b1', to: 'f', label: 'ε' }]} start="s" />

      <T x={8} y={334} size={12} weight={700} fill={tok('muted')}>r* (star)</T>
      <Part x={110} y={400} w={140} name="N(r)" />
      <Fsm
        states={[{ id: 's', x: 50, y: 400 }, { id: 'a0', x: 138, y: 400, label: '' }, { id: 'a1', x: 222, y: 400, label: '' }, { id: 'f', x: 320, y: 400, accept: true }]}
        edges={[
          { from: 's', to: 'a0', label: 'ε' },
          { from: 'a1', to: 'f', label: 'ε' },
        ]}
        start="s" />
      <path d="M222,417 Q180,478 138,417" fill="none" stroke={tok('ink', 0.55)} strokeWidth={1.5} />
      <polygon points="138,417 139,426 145,421" fill={tok('ink', 0.55)} />
      <T x={180} y={458} size={11} mono anchor="middle">ε  again</T>
      <path d="M58,384 Q185,318 312,384" fill="none" stroke={tok('ink', 0.55)} strokeWidth={1.5} />
      <polygon points="312,384 303,382 307,376" fill={tok('ink', 0.55)} />
      <T x={185} y={342} size={11} mono anchor="middle">ε  skip</T>
    </Svg>
  );
}
