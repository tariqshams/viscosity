// Chapter 102: one function in four forms. The VIR listing is the real
// output of Viscosity's JavaScript front end (printFunc), for
//   function dist(a, b) { if (a > b) return a - b; return b - a; }
import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const SRC = `function dist(a, b) {
  if (a > b) return a - b;
  return b - a;
}`;

const VIR = `func dist(%0, %1):
  b0:
    %0 = param
    %1 = param
    %2 = binop > %0, %1
    condbr %2, b1, b2
  b1:  ; preds b0
    %3 = binop - %0, %1
    return %3
  b2:  ; preds b0
    br b3
  b3:  ; preds b2
    %4 = binop - %1, %0
    return %4`;

type View = 'src' | 'ast' | 'vir' | 'cfg';
type S = { view: View; line?: number | null; hot?: string; note: string };

const STATES: S[] = [
  { view: 'src', line: null, note: 'The source: text, as you typed it. Spaces, brackets and keywords all matter to the parser, and none of them matter to an optimizer.' },
  { view: 'ast', note: 'The syntax tree (chapter 44). The punctuation is gone, but the shape still follows the grammar: an If node holding a Return holding a subtraction. To find every subtraction you must walk the whole tree.' },
  { view: 'ast', hot: 'ret', note: 'Notice how much the tree hides. Is the second return always reached? Only if the test is false. That fact is not written anywhere in the tree; you have to know what an If means.' },
  { view: 'vir', line: 4, note: 'Lowered to VIR, Viscosity’s IR. Each line does one thing and names its result: %2 is the comparison. Parameters a and b became %0 and %1.' },
  { view: 'vir', line: 5, note: 'Control flow is now explicit. condbr (“conditional branch”) says: if %2 is true go to b1, else go to b2. There is no If node any more, only labelled pieces of code and jumps between them.' },
  { view: 'cfg', note: 'The same VIR drawn as a graph: each b is a block of straight-line code, each arrow a possible jump. “Which code can run after b0?” is now a question you answer by following arrows.' },
  { view: 'cfg', hot: 'b3', note: 'b3, the second return, has only one way in: from b0 through b2, on the false path. What the tree hid is now a fact you can read off the picture. Questions like this are what an IR is for.' },
];

function Node({ x, y, label, hot }: { x: number; y: number; label: string; hot?: boolean }) {
  const w = label.length * 7.4 + 14;
  return (
    <g>
    <rect x={x - w / 2} y={y - 11} width={w} height={22} rx={4} fill={tok('paper')} />
    <Box x={x - w / 2} y={y - 11} w={w} h={22} r={4} fill={hot ? tok('brand', 0.2) : tok('panel')} stroke={hot ? tok('brand') : tok('line')}>
      <T x={x} y={y} size={12} mono anchor="middle">{label}</T>
    </Box>
    </g>
  );
}

function Ast({ hot }: { hot?: string }) {
  const edges: [number, number, number, number][] = [
    [200, 18, 110, 70], [200, 18, 310, 70],
    [110, 70, 50, 125], [110, 70, 170, 125],
    [50, 125, 25, 180], [50, 125, 75, 180],
    [170, 125, 170, 180],
    [310, 70, 310, 125], [310, 125, 285, 180], [310, 125, 335, 180],
    [170, 180, 145, 232], [170, 180, 195, 232],
  ];
  const r = hot === 'ret';
  return (
    <Svg w={400} h={250} title="The syntax tree of dist: a function holding an If and a Return. The If holds the comparison a > b and a Return of a - b; the last Return holds b - a.">
      {edges.map(([a, b, c, d], k) => <line key={k} x1={a} y1={b} x2={c} y2={d} stroke={tok('line')} strokeWidth={1.5} />)}
      <Node x={200} y={18} label="Function dist" />
      <Node x={110} y={70} label="If" />
      <Node x={310} y={70} label="Return" hot={r} />
      <Node x={50} y={125} label="Binary >" />
      <Node x={170} y={125} label="Return" />
      <Node x={310} y={125} label="Binary -" hot={r} />
      <Node x={25} y={180} label="a" />
      <Node x={75} y={180} label="b" />
      <Node x={170} y={180} label="Binary -" />
      <Node x={285} y={180} label="b" hot={r} />
      <Node x={335} y={180} label="a" hot={r} />
      <Node x={145} y={232} label="a" />
      <Node x={195} y={232} label="b" />
    </Svg>
  );
}

function Blk({ x, y, w, name, lines, hot }: { x: number; y: number; w: number; name: string; lines: string[]; hot?: boolean }) {
  const h = 22 + lines.length * 16;
  return (
    <Box x={x} y={y} w={w} h={h} fill={hot ? tok('brand', 0.18) : tok('panel')} stroke={hot ? tok('brand') : tok('line')}>
      <T x={x + 8} y={y + 12} size={11} weight={700} fill={tok('accent')}>{name}</T>
      {lines.map((l, k) => <T key={k} x={x + 8} y={y + 29 + k * 16} size={11} mono>{l}</T>)}
    </Box>
  );
}

function Cfg({ hot }: { hot?: string }) {
  return (
    <Svg w={400} h={262} title="The control-flow graph of dist: b0 branches to b1 (return a - b) and b2; b2 jumps to b3 (return b - a).">
      <Blk x={110} y={6} w={180} name="b0" lines={['%2 = binop > %0, %1', 'condbr %2, b1, b2']} />
      <Blk x={10} y={110} w={170} name="b1" lines={['%3 = binop - %0, %1', 'return %3']} />
      <Blk x={230} y={110} w={150} name="b2" lines={['br b3']} hot={hot === 'b3'} />
      <Blk x={210} y={190} w={180} name="b3" lines={['%4 = binop - %1, %0', 'return %4']} hot={hot === 'b3'} />
      <Arrow x1={160} y1={60} x2={110} y2={108} />
      <Arrow x1={240} y1={60} x2={290} y2={108} />
      <Arrow x1={305} y1={150} x2={305} y2={188} />
      <T x={104} y={80} size={11} fill={tok('safe')}>true</T>
      <T x={282} y={80} size={11} fill={tok('danger')}>false</T>
    </Svg>
  );
}

export default function FourForms() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="One function, four forms" steps={s} note={st.note}>
      <div className="mb-2 flex gap-1 text-xs font-semibold">
        {(['src', 'ast', 'vir', 'cfg'] as View[]).map((v) => (
          <span key={v} className={v === st.view ? 'rounded bg-brand/20 px-2 py-0.5 text-brand' : 'px-2 py-0.5 text-muted'}>
            {{ src: 'source', ast: 'tree', vir: 'IR listing', cfg: 'graph' }[v]}
          </span>
        ))}
      </div>
      {st.view === 'src' && <CodeTrace code={SRC} line={st.line ?? null} />}
      {st.view === 'ast' && <Ast hot={st.hot} />}
      {st.view === 'vir' && <CodeTrace code={VIR} line={st.line ?? null} />}
      {st.view === 'cfg' && <Cfg hot={st.hot} />}
    </StepFrame>
  );
}
