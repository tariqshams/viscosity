import { useState } from 'react';
import { StepFrame, useSteps } from '../../viz/stepper';
import { Svg, T, tok } from '../../viz/svg';
import { type PT, drawTree, frontier, layout, shownAfter } from './ptree';

// print 1 + 2 ;  under  stmt → "print" expr ";"
//                       expr → expr "+" item | item
//                       item → NUMBER | "(" expr ")"
const TREE: PT = {
  id: 's', label: 'stmt', kids: [
    { id: 'p', label: 'print', term: true },
    { id: 'e', label: 'expr', kids: [
      { id: 'e2', label: 'expr', kids: [
        { id: 'i1', label: 'item', kids: [{ id: 'n1', label: 'NUMBER', term: true, lex: '1' }] },
      ] },
      { id: 'pl', label: '+', term: true },
      { id: 'i2', label: 'item', kids: [{ id: 'n2', label: 'NUMBER', term: true, lex: '2' }] },
    ] },
    { id: 'sc', label: ';', term: true },
  ],
};

const RULE: Record<string, string> = {
  s: 'stmt → "print" expr ";"',
  e: 'expr → expr "+" item',
  e2: 'expr → item',
  i1: 'item → NUMBER',
  i2: 'item → NUMBER',
};

type Mode = 'left' | 'right';
const ORDER: Record<Mode, string[]> = { left: ['s', 'e', 'e2', 'i1', 'i2'], right: ['s', 'e', 'i2', 'e2', 'i1'] };

const NOTES: Record<Mode, string[]> = {
  left: [
    'We start from the start symbol, stmt: one nonterminal and nothing else. Its node is the root of the tree.',
    'Step 1: stmt has one rule, so we use it. stmt is replaced by print expr ; and the root grows three children.',
    'Step 2: the leftmost nonterminal is the only one, expr. We pick expr → expr "+" item, because the sentence has a plus sign.',
    'Step 3: now there are two nonterminals, expr and item. Leftmost means we rewrite expr first, with expr → item.',
    'Step 4: the leftmost nonterminal is now the first item. item → NUMBER gives the token for 1.',
    'Step 5: one nonterminal is left, the second item, and item → NUMBER finishes it. Only terminals remain: this is the sentence print 1 + 2 ;',
  ],
  right: [
    'The same sentence again, from the same start symbol. This time we always rewrite the rightmost nonterminal.',
    'Step 1: stmt → "print" expr ";", exactly as before; with one nonterminal, leftmost and rightmost are the same.',
    'Step 2: still one nonterminal, expr, and the same rule, expr → expr "+" item.',
    'Step 3: here the two orders part. Of expr and item, item is further right, so it goes first: item → NUMBER gives the 2.',
    'Step 4: now the only nonterminal left is expr, and expr → item replaces it.',
    'Step 5: item → NUMBER gives the 1. Different order, same five rules, and the finished tree is exactly the same tree.',
  ],
};

const PLACED = layout(TREE, 10, 390, 92, 38);

function states(mode: Mode) {
  const order = ORDER[mode];
  return order.concat(['']).map((_, k) => {
    const done = order.slice(0, k);
    return { done, next: order[k], rule: k > 0 ? RULE[order[k - 1]] : null, note: NOTES[mode][k] };
  });
}
const LEFT = states('left');
const RIGHT = states('right');

export default function DeriveSteps() {
  const [mode, setMode] = useState<Mode>('left');
  const sl = useSteps(LEFT);
  const sr = useSteps(RIGHT);
  const s = mode === 'left' ? sl : sr;
  const st = s.state;
  const form = frontier(TREE, st.done);
  const cw = (p: PT) => Math.max(14, p.label.length * 7.8) + 8;
  const total = form.reduce((w, p) => w + cw(p), 0);
  let x = 200 - total / 2;
  return (
    <StepFrame title="A derivation, and the tree it draws" steps={s} note={st.note}>
      <div className="mb-2 flex gap-2">
        {(['left', 'right'] as Mode[]).map((m) => (
          <button key={m} type="button" className={'btn-3d px-3 py-1 text-sm' + (m === mode ? ' btn-3d-primary font-semibold' : '')}
            onClick={() => { setMode(m); (m === 'left' ? sl : sr).reset(); }} aria-pressed={m === mode}>
            {m === 'left' ? 'Leftmost' : 'Rightmost'}
          </button>
        ))}
      </div>
      <Svg w={400} h={300} title="Above, the current sentential form with the nonterminal to rewrite next ringed; below, the parse tree drawn so far.">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>SENTENTIAL FORM</T>
        {form.map((p) => {
          const w = cw(p);
          const cx = x + w / 2;
          x += w;
          const nt = !p.term;
          const isNext = p.id === st.next;
          return (
            <g key={p.id}>
              <T x={cx} y={36} size={13} mono anchor="middle" weight={nt ? 700 : 400} fill={nt ? tok('brand') : undefined}>{p.label}</T>
              {isNext && <line x1={cx - w / 2 + 3} y1={47} x2={cx + w / 2 - 3} y2={47} stroke={tok('brand')} strokeWidth={2.5} />}
            </g>
          );
        })}
        <T x={8} y={64} size={11} weight={700} fill={tok('muted')}>{st.rule ? 'LAST RULE USED: ' : 'NO RULE USED YET'}</T>
        {st.rule && <T x={130} y={64} size={12} mono>{st.rule}</T>}
        {drawTree(PLACED, shownAfter(TREE, st.done), st.next)}
      </Svg>
    </StepFrame>
  );
}
