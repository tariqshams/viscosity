import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// stmt → "print" expr ";"   expr → item rest
// rest → "+" item rest | ε  item → NUMBER | "(" expr ")"
const NTS = ['stmt', 'expr', 'rest', 'item'];
type Row = { nul: boolean; first: string[]; follow: string[] };
type S = { phase: string; rows: Record<string, Row>; fresh: string[]; note: string };

const E: Row = { nul: false, first: [], follow: [] };
function rows(p: Partial<Record<string, Partial<Row>>>, base?: Record<string, Row>): Record<string, Row> {
  const out: Record<string, Row> = {};
  for (const n of NTS) out[n] = { ...(base?.[n] ?? E), ...(p[n] ?? {}) };
  return out;
}

const R0 = rows({});
const N1 = rows({ rest: { nul: true } });
const F1 = rows({ stmt: { first: ['print'] }, rest: { first: ['+'] }, item: { first: ['NUMBER', '('] } }, N1);
const F2 = rows({ expr: { first: ['NUMBER', '('] } }, F1);
const W0 = rows({ stmt: { follow: ['$'] } }, F2);
const W1 = rows({ expr: { follow: [';', ')'] }, rest: { follow: [';'] }, item: { follow: ['+', ';'] } }, W0);
const W2 = rows({ rest: { follow: [';', ')'] }, item: { follow: ['+', ';', ')'] } }, W1);

const STATES: S[] = [
  { phase: 'start', rows: R0, fresh: [], note: 'Every set starts empty, and nobody is nullable yet. We will sweep over the rules again and again, adding what each rule proves, until a whole sweep adds nothing.' },
  { phase: 'nullable · sweep 1', rows: N1, fresh: ['rest:nul'], note: 'Nullable, sweep 1: rest → ε has an empty body, so rest can vanish. No other rule has a body made only of nullable symbols.' },
  { phase: 'nullable · sweep 2', rows: N1, fresh: [], note: 'Sweep 2 learns nothing new, so nullable is finished: only rest.' },
  { phase: 'FIRST · sweep 1', rows: F1, fresh: ['stmt:first', 'rest:first', 'item:first'], note: 'FIRST, sweep 1, in rule order. stmt starts with "print". expr → item rest copies FIRST(item), but item has not been visited yet, so it copies nothing. rest gets +; item gets NUMBER and (.' },
  { phase: 'FIRST · sweep 2', rows: F2, fresh: ['expr:first'], note: 'Sweep 2: this time FIRST(item) is full, so expr → item rest copies NUMBER and ( into FIRST(expr). Because item is not nullable, we stop there and never look at rest.' },
  { phase: 'FIRST · sweep 3', rows: F2, fresh: [], note: 'Sweep 3 adds nothing: the FIRST sets are finished. The answer was reached by repeating a simple step, not by being clever about order.' },
  { phase: 'FOLLOW · start', rows: W0, fresh: ['stmt:follow'], note: 'FOLLOW starts with one fact: the end of the input, written $, can follow the start symbol.' },
  { phase: 'FOLLOW · sweep 1', rows: W1, fresh: ['expr:follow', 'rest:follow', 'item:follow'], note: 'Sweep 1. In stmt → "print" expr ";", a ; follows expr. In expr → item rest, FIRST(rest) = + follows item; rest is nullable, so whatever follows expr (;) follows item and rest too. Last, item → "(" expr ")" adds ) to FOLLOW(expr).' },
  { phase: 'FOLLOW · sweep 2', rows: W2, fresh: ['rest:follow', 'item:follow'], note: 'Sweep 2: the ) that arrived late in FOLLOW(expr) now flows on, through expr → item rest, into FOLLOW(item) and FOLLOW(rest).' },
  { phase: 'FOLLOW · sweep 3', rows: W2, fresh: [], note: 'Sweep 3 adds nothing. Every set is final: this resting point is called a fixed point.' },
];

const COLS = [{ k: 'nul', x: 92, w: 52, t: 'nullable' }, { k: 'first', x: 150, w: 112, t: 'FIRST' }, { k: 'follow', x: 268, w: 128, t: 'FOLLOW' }] as const;

export default function FixpointSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Sweeping until nothing changes" steps={s} note={st.note}>
      <Svg w={400} h={196} title="A table with a row for each nonterminal and columns nullable, FIRST and FOLLOW, filled in sweep by sweep.">
        <T x={8} y={12} size={11} weight={700} fill={tok('brand')}>{st.phase.toUpperCase()}</T>
        {COLS.map((c) => <T key={c.k} x={c.x + c.w / 2} y={36} size={11} weight={700} anchor="middle" fill={tok('muted')}>{c.t}</T>)}
        {NTS.map((n, r) => {
          const y = 50 + r * 36;
          const row = st.rows[n];
          return (
            <g key={n}>
              <T x={8} y={y + 14} size={13} mono weight={700}>{n}</T>
              {COLS.map((c) => {
                const isNew = st.fresh.includes(`${n}:${c.k}`);
                const text = c.k === 'nul' ? (row.nul ? 'yes' : '') : `{ ${row[c.k].join(' ')} }`;
                return (
                  <Box key={c.k} x={c.x} y={y} w={c.w} h={28} fill={isNew ? tok('brand', 0.22) : tok('panel')} stroke={isNew ? tok('brand') : tok('line')}>
                    <T x={c.x + c.w / 2} y={y + 14.5} size={12} mono anchor="middle">{text}</T>
                  </Box>
                );
              })}
            </g>
          );
        })}
      </Svg>
    </StepFrame>
  );
}
