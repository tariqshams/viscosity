// Building the LR(0) automaton for the small expression grammar, one goto
// at a time: the state being left, the symbol, and the state reached
// (kernel items in ink, items added by closure in the brand colour).
import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// an item is written out as text; '+' marks an item added by closure
type It = { t: string; added?: boolean };
type S = { from?: number; fromItems?: string[]; hotSym?: string; sym?: string; to: number; items: It[]; old?: boolean; known: number; note: string };

const I0 = ['S → · E', 'E → · E + T', 'E → · T', 'T → · n', 'T → · ( E )'];
const STATES: S[] = [
  { to: 0, items: [{ t: 'S → · E' }], known: 1, note: 'Start with one item, S → · E: nothing read yet, and the whole job is to see an E. This lone item is the kernel of state 0.' },
  { to: 0, items: [{ t: 'S → · E' }, { t: 'E → · E + T', added: true }, { t: 'E → · T', added: true }], known: 1, note: 'Closure. The dot is in front of E, so we might be at the very start of any E rule: add E → · E + T and E → · T, with the dot at the front.' },
  { to: 0, items: I0.map((t, k) => ({ t, added: k > 0 })), known: 1, note: 'Closure again, on the new items: E → · T has the dot in front of T, so add both T rules. Nothing new appears after that, so state 0 is finished.' },
  { from: 0, fromItems: I0, hotSym: 'E', sym: 'E', to: 1, items: [{ t: 'S → E ·' }, { t: 'E → E · + T' }], known: 2, note: 'goto(0, E): take the items with E after the dot (lit on the left), move the dot over it. The dots now sit before + and at the end, so closure adds nothing. New state 1.' },
  { from: 0, fromItems: I0, hotSym: 'T', sym: 'T', to: 2, items: [{ t: 'E → T ·' }], known: 3, note: 'goto(0, T) gives one complete item, E → T ·. A dot at the end means a whole body is on the stack. New state 2.' },
  { from: 0, fromItems: I0, hotSym: 'n', sym: 'n', to: 3, items: [{ t: 'T → n ·' }], known: 4, note: 'goto(0, n) gives T → n ·, also complete. New state 3.' },
  { from: 0, fromItems: I0, hotSym: '(', sym: '(', to: 4, items: [{ t: 'T → ( · E )' }, { t: 'E → · E + T', added: true }, { t: 'E → · T', added: true }, { t: 'T → · n', added: true }, { t: 'T → · ( E )', added: true }], known: 5, note: 'goto(0, “(”): the dot moves past the bracket and lands before E, so closure pulls in every E rule and then every T rule. New state 4.' },
  { from: 1, fromItems: ['S → E ·', 'E → E · + T'], hotSym: '+', sym: '+', to: 5, items: [{ t: 'E → E + · T' }, { t: 'T → · n', added: true }, { t: 'T → · ( E )', added: true }], known: 6, note: 'Now state 1, on +. The dot lands before T, so closure adds the two T rules (but not the E rules: no dot is in front of an E). New state 5.' },
  { from: 4, fromItems: ['T → ( · E )', 'E → · E + T', 'E → · T', 'T → · n', 'T → · ( E )'], hotSym: 'E', sym: 'E', to: 6, items: [{ t: 'T → ( E · )' }, { t: 'E → E · + T' }], known: 7, note: 'State 4 on E gives a new state 6. State 4 on T, n and “(” gives item sets we have already met (states 2, 3 and 4 itself), so those are arrows back to old states, not new ones.' },
  { from: 5, fromItems: ['E → E + · T', 'T → · n', 'T → · ( E )'], hotSym: 'T', sym: 'T', to: 7, items: [{ t: 'E → E + T ·' }], known: 8, note: 'State 5 on T: E → E + T ·, complete. New state 7. (State 5 on n and “(” goes back to the old states 3 and 4.)' },
  { from: 6, fromItems: ['T → ( E · )', 'E → E · + T'], hotSym: ')', sym: ')', to: 8, items: [{ t: 'T → ( E ) ·' }], known: 9, note: 'State 6 on “)”: T → ( E ) ·, the last new state. State 6 on + leads back to state 5.' },
  { to: 8, items: [{ t: 'T → ( E ) ·' }], known: 9, old: true, note: 'Every state has been tried on every symbol after one of its dots, and no new item set appears: the automaton has 9 states. The five with a complete item (1, 2, 3, 7, 8) are where a reduction can happen.' },
];

function ItemBox({ x, title, items, hot, accent }: { x: number; title: string; items: It[]; hot?: string; accent?: boolean }) {
  const h = 26 + items.length * 17;
  return (
    <Box x={x} y={8} w={168} h={h} stroke={accent ? tok('brand') : tok('line')}>
      <T x={x + 8} y={20} size={12} weight={700} fill={accent ? tok('brand') : tok('muted')}>{title}</T>
      {items.map((it, k) => {
        const lit = hot !== undefined && it.t.includes(`· ${hot}`);
        return (
          <T key={k} x={x + 10} y={40 + k * 17} size={12} mono weight={lit ? 700 : 400} fill={it.added ? tok('brand') : lit ? tok('accent') : undefined}>{it.t}</T>
        );
      })}
    </Box>
  );
}

export default function ClosureSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Building the LR(0) automaton" steps={s} note={st.note}>
      <Svg w={400} h={200} title="The state being left, the symbol read, and the state that closure and goto produce">
        {st.from !== undefined && st.fromItems && (
          <>
            <ItemBox x={4} title={`state ${st.from}`} items={st.fromItems.map((t) => ({ t }))} hot={st.hotSym} />
            <Arrow x1={176} y1={60} x2={226} y2={60} color={tok('accent')} />
            <T x={201} y={48} size={13} mono anchor="middle" weight={700} fill={tok('accent')}>{st.sym}</T>
          </>
        )}
        <ItemBox x={st.from !== undefined ? 228 : 116} title={`state ${st.to}`} items={st.items} accent />
        {Array.from({ length: 9 }, (_, k) => (
          <g key={k}>
            <Box x={22 + k * 41} y={160} w={34} h={26} fill={k < st.known ? (k === st.to && !st.old ? tok('brand', 0.2) : tok('panel')) : tok('ink', 0.04)} stroke={k < st.known ? tok('ink', 0.5) : tok('line')} dash={k >= st.known} />
            <T x={39 + k * 41} y={174} size={12} mono anchor="middle" fill={k < st.known ? undefined : tok('muted')}>{k}</T>
          </g>
        ))}
        <T x={200} y={150} size={11} anchor="middle" fill={tok('muted')}>states found so far (closure items in colour)</T>
      </Svg>
    </StepFrame>
  );
}
