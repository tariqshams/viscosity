// typeOf walking price * 2 + "1" with price : number in Γ. Types are
// computed children first and written under each node, exactly as
// values were in the interpreter; at the root, + has no rule for a
// number and a string, so the checker reports an error.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

type Id = 'plus' | 'times' | 'price' | 'two' | 'one';
const NODES: Record<Id, { x: number; y: number; label: string }> = {
  plus: { x: 200, y: 34, label: '+' },
  times: { x: 120, y: 104, label: '*' },
  one: { x: 280, y: 104, label: '"1"' },
  price: { x: 70, y: 174, label: 'price' },
  two: { x: 170, y: 174, label: '2' },
};
const EDGES: [Id, Id][] = [['plus', 'times'], ['plus', 'one'], ['times', 'price'], ['times', 'two']];

type S = { types: Partial<Record<Id, string>>; active: Id | null; bad?: boolean; note: string };
const STATES: S[] = [
  { types: {}, active: 'plus', note: 'typeOf starts at the root, a binary +. Like evaluate, it cannot decide anything about + until it knows its operands, so it goes down to the left child first.' },
  { types: { price: 'number' }, active: 'price', note: 'A variable: look it up in Γ (rule T-Var). Γ says price : number, so this node has type number. No value is read; there is none yet.' },
  { types: { price: 'number', two: 'number' }, active: 'two', note: 'A number literal: always type number (an axiom, nothing to check).' },
  { types: { price: 'number', two: 'number', times: 'number' }, active: 'times', note: '* on a number and a number: the rule for arithmetic gives number. The left side of + is done.' },
  { types: { price: 'number', two: 'number', times: 'number', one: 'string' }, active: 'one', note: 'A string literal: type string. Now both operands of + have types.' },
  { types: { price: 'number', two: 'number', times: 'number', one: 'string', plus: 'error' }, active: 'plus', bad: true, note: '+ has a rule for two numbers and a rule for two strings, but none for a number and a string. The checker reports: cannot add a number and a string. Nothing has run.' },
];

export default function CheckerWalk() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title='Checking price * 2 + "1"' steps={s} note={st.note}>
      <Svg w={400} h={226} title={`The tree of price * 2 + "1" with the types found so far: ${Object.entries(st.types).map(([k, v]) => `${NODES[k as Id].label} is ${v}`).join(', ') || 'none yet'}.`}>
        <Box x={300} y={160} w={96} h={50} fill={tok('accent', 0.1)} stroke={tok('accent')}>
          <T x={348} y={174} size={11} anchor="middle" fill={tok('muted')}>Γ</T>
          <T x={348} y={194} size={12} anchor="middle" mono>price : number</T>
        </Box>
        {EDGES.map(([a, b]) => (
          <Arrow key={a + b} x1={NODES[a].x} y1={NODES[a].y + 14} x2={NODES[b].x} y2={NODES[b].y - 15} color={tok('line')} width={1.5} />
        ))}
        {(Object.keys(NODES) as Id[]).map((id) => {
          const n = NODES[id];
          const t = st.types[id];
          const active = st.active === id;
          const col = t === 'error' ? tok('danger') : active ? tok('brand') : t ? tok('safe') : tok('line');
          return (
            <g key={id}>
              <Box x={n.x - 30} y={n.y - 14} w={60} h={28} stroke={col} fill={active ? tok('brand', 0.12) : tok('panel')}>
                <T x={n.x} y={n.y} size={14} mono anchor="middle" weight={active ? 700 : 400}>{n.label}</T>
              </Box>
              {t && <T x={n.x} y={n.y + 26} size={12} mono anchor="middle" weight={700} fill={t === 'error' ? tok('danger') : tok('safe')}>{t === 'error' ? 'no rule!' : ': ' + t}</T>}
            </g>
          );
        })}
      </Svg>
    </StepFrame>
  );
}
