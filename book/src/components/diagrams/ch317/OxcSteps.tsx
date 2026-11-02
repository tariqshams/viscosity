// Chapter 317: the life of oxc's AST inside JsPlugin::lower
// (engine/rust/crates/frontend-js/src/lib.rs). The allocator is a local of
// lower, the parser bump-allocates the AST into it, resolve and lower read
// the AST and produce owned results (the VIR Module and JsExtra, whose node
// facts hold oxc Spans: plain u32 pairs), and the arena is freed in one go
// when lower returns. The 7,160 bytes were measured with
// Allocator::used_bytes() after parsing tests/extra/unicode_offsets.js
// (762 bytes of source, as of 288e497) with oxc 0.156; the 16-byte Expression with
// std::mem::size_of on the same machine.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const NODES = [
  { label: 'Program', w: 46 },
  { label: 'VarDecl', w: 44 },
  { label: 'For', w: 30 },
  { label: 'Expr', w: 34 },
  { label: 'Member', w: 40 },
  { label: '…', w: 16 },
];

type S = { fill: boolean; life?: boolean; out?: boolean; gone?: boolean; emit?: boolean; note: string };

const STATES: S[] = [
  { fill: false, note: 'lower starts by making an Allocator, a local variable. It is a bump arena: a chunk of memory and a cursor. Nothing is in it yet.' },
  { fill: true, note: 'The parser allocates every node into the arena, one after another, just bumping the cursor. An Expression is a 16-byte enum: a tag and oxc’s own Box, a pointer to the node in the arena.' },
  { fill: true, life: true, note: 'The tree’s type is Program<\'a>, where \'a is the borrow of the allocator. The tree can’t outlive the arena it lives in, so it can’t be stored in the Module that lower returns.' },
  { fill: true, life: true, out: true, note: 'Scope resolution and lowering read the tree and build owned results: the VIR Module, and JsExtra with node facts. Those facts keep oxc Spans, which are two u32s with no lifetime, so they outlive the tree.' },
  { fill: true, out: true, gone: true, note: 'lower returns and the allocator is dropped. The whole arena goes back at once, with no Drop run for any node: for unicode_offsets.js, 7,160 bytes of nodes for a 762-byte file.' },
  { fill: false, out: true, gone: true, emit: true, note: 'Later, emit gets the source, the plan and JsExtra. Everything it needs is a byte range in the source, so splicing never needs the tree again.' },
];

export default function OxcSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  let x = 22;
  return (
    <StepFrame title="The AST’s life inside lower" steps={s} note={st.note}>
      <Svg w={400} h={260} title="oxc allocates the AST in an arena that lives only while lower runs">
        <Box x={8} y={10} w={252} h={178} r={6} fill={st.gone ? tok('panel') : tok('brand', 0.05)} stroke={st.gone ? tok('line') : tok('brand')} dash={st.gone} opacity={st.gone ? 0.6 : 1}>
          <T x={18} y={26} size={11} mono weight={700} fill={tok('brand')}>fn lower(&amp;self, source)</T>
          <T x={18} y={50} size={10} fill={tok('muted')}>{st.gone ? 'allocator dropped: arena freed at once' : 'let allocator = Allocator::default();'}</T>
          <Box x={18} y={60} w={232} h={34} r={3} fill={tok('paper')} stroke={tok('line')} dash={!st.fill}>
            {st.fill && !st.gone && NODES.map((n) => {
              const nx = x;
              x += n.w + 3;
              return (
                <g key={n.label}>
                  <rect x={nx} y={64} width={n.w} height={26} rx={2} fill={tok('accent', 0.2)} stroke={tok('accent')} strokeWidth={1} />
                  <T x={nx + n.w / 2} y={77} size={9.5} mono anchor="middle">{n.label}</T>
                </g>
              );
            })}
          </Box>
          {st.life && (
            <T x={18} y={110} size={10} mono fill={tok('warn')}>Program&lt;'a&gt;: 'a = borrow of allocator</T>
          )}
          <Box x={18} y={124} w={104} h={26} r={3} fill={st.out && !st.gone ? tok('accent', 0.12) : tok('panel')} stroke={tok('line')}>
            <T x={70} y={137} size={10} mono anchor="middle">resolve</T>
          </Box>
          <Box x={146} y={124} w={104} h={26} r={3} fill={st.out && !st.gone ? tok('accent', 0.12) : tok('panel')} stroke={tok('line')}>
            <T x={198} y={137} size={10} mono anchor="middle">lower</T>
          </Box>
          <T x={18} y={170} size={10} fill={tok('muted')}>parse → resolve scopes → lower to VIR</T>
        </Box>
        <Box x={276} y={40} w={116} h={40} r={4} fill={st.out ? tok('safe', 0.14) : tok('panel')} stroke={st.out ? tok('safe') : tok('line')} opacity={st.out ? 1 : 0.4}>
          <T x={334} y={55} size={10.5} mono anchor="middle" weight={700}>Module</T>
          <T x={334} y={70} size={9.5} anchor="middle">VIR, owned</T>
        </Box>
        <Box x={276} y={100} w={116} h={50} r={4} fill={st.out ? tok('safe', 0.14) : tok('panel')} stroke={st.out ? tok('safe') : tok('line')} opacity={st.out ? 1 : 0.4}>
          <T x={334} y={114} size={10.5} mono anchor="middle" weight={700}>JsExtra</T>
          <T x={334} y={129} size={9.5} anchor="middle">node facts</T>
          <T x={334} y={142} size={9.5} mono anchor="middle">Span {'{'} start, end {'}'}</T>
        </Box>
        {st.out && (
          <g>
            <Arrow x1={250} y1={132} x2={274} y2={64} color={tok('safe')} width={1.6} />
            <Arrow x1={250} y1={140} x2={274} y2={124} color={tok('safe')} width={1.6} />
          </g>
        )}
        <Box x={8} y={204} w={384} h={40} r={5} fill={st.emit ? tok('brand', 0.12) : tok('panel')} stroke={st.emit ? tok('brand') : tok('line')} opacity={st.emit ? 1 : 0.4}>
          <T x={200} y={218} size={10.5} mono anchor="middle">emit(source, &amp;lowered, plan)</T>
          <T x={200} y={234} size={9.5} anchor="middle">splices byte ranges of source; no tree needed</T>
        </Box>
        {st.emit && <Arrow x1={334} y1={152} x2={334} y2={202} color={tok('brand')} width={1.6} />}
      </Svg>
    </StepFrame>
  );
}
