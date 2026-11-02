import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// One trip round total_dyn's loop (rustc 1.97, -O, x86-64), then the
// generic loop for comparison. Top: the slice of fat pointers; right: the
// vtable for Sq; bottom: where control goes.

const DYN = `mov  rdi, [r14 + r12]      ; data
mov  rax, [r14 + r12 + 8]  ; vtable
call [rax + 24]            ; area()
add  r15d, eax
add  r12, 16`;

const GEN = `movdqu  xmm2, [rdi + rdx]   ; 4 Sqs
movdqu  xmm3, [rdi + rdx + 16]
pmuludq xmm2, xmm2   ; square 4
paddd   xmm1, xmm2   ; add 4
add     rdx, 32      ; 8 done`;

type S = { gen: boolean; line: number | null; hi: 'none' | 'data' | 'vt' | 'slot' | 'call' | 'next' | 'vec'; note: string };

const STATES: S[] = [
  { gen: false, line: null, hi: 'none', note: 'xs is a &[&dyn Shape]: a row of fat pointers, 16 bytes each. Every one is a data pointer (to an Sq) and a vtable pointer (to Sq’s table for Shape).' },
  { gen: false, line: 0, hi: 'data', note: 'First load: the data pointer of element r12 goes into rdi, which is where the first argument (self) is passed.' },
  { gen: false, line: 1, hi: 'vt', note: 'Second load: the vtable pointer, 8 bytes further on. Nothing has been called yet; two loads so far.' },
  { gen: false, line: 2, hi: 'slot', note: 'call [rax + 24] reads slot 3 of the vtable (after drop, size and align) and jumps to whatever address is there: Sq::area. The processor must guess the target; with one type in the list it guesses right every time.' },
  { gen: false, line: 3, hi: 'call', note: 'area returns its answer in eax and the loop adds it to the total. The loop never saw area’s body, so it could not combine its work with the next element’s.' },
  { gen: false, line: 4, hi: 'next', note: 'Move 16 bytes to the next fat pointer and go round again: one shape per trip, one indirect call per shape.' },
  { gen: true, line: 0, hi: 'vec', note: 'Now total::<Sq>. Here xs is a plain &[Sq]: the numbers sit side by side, 4 bytes each, with no pointers. movdqu loads four of them into one 16-byte register at once.' },
  { gen: true, line: 2, hi: 'vec', note: 'area was inlined, so the loop knows it is “x times x” and squares four numbers with one instruction, then adds four at once. Eight shapes per trip, and no call anywhere.' },
];

export default function DynCallSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const h = (k: S['hi']) => st.hi === k;
  return (
    <StepFrame title={st.gen ? 'The generic loop: no call at all' : 'One trip round the dyn loop'} steps={s} note={st.note}>
      <CodeTrace code={st.gen ? GEN : DYN} line={st.line} />
      <Svg w={400} h={175} title="Memory: a slice of fat pointers and a vtable, or a plain slice of numbers">
        {!st.gen && (
          <g>
            <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>xs: &amp;[&amp;dyn Shape]</T>
            {[0, 1].map((k) => (
              <g key={k}>
                <Box x={8 + k * 118} y={22} w={56} h={26} r={3} fill={k === 0 && h('data') ? tok('f1', 0.25) : tok('panel')} stroke={k === 0 && (h('data') || h('next')) ? tok('f1') : tok('line')}>
                  <T x={36 + k * 118} y={35} size={11} mono anchor="middle">data</T>
                </Box>
                <Box x={64 + k * 118} y={22} w={56} h={26} r={3} fill={k === 0 && h('vt') ? tok('brand', 0.25) : tok('panel')} stroke={k === 0 && h('vt') ? tok('brand') : tok('line')}>
                  <T x={92 + k * 118} y={35} size={11} mono anchor="middle">vtable</T>
                </Box>
              </g>
            ))}
            <T x={244} y={35} size={12} mono fill={tok('muted')}>…</T>
            {h('next') && <Arrow x1={40} y1={58} x2={150} y2={58} color={tok('f1')} />}
            {h('next') && <T x={95} y={70} size={11} anchor="middle" fill={tok('f1')}>+16 bytes</T>}

            <T x={8} y={92} size={11} weight={700} fill={tok('muted')}>Sq</T>
            <Box x={8} y={100} w={70} h={24} r={3} fill={tok('f1', 0.12)} stroke={tok('f1')}>
              <T x={43} y={112} size={11} mono anchor="middle">Sq(3)</T>
            </Box>
            {(h('data') || h('slot') || h('call')) && <Arrow x1={30} y1={50} x2={30} y2={98} color={tok('f1')} />}

            <T x={268} y={60} size={11} weight={700} fill={tok('muted')}>vtable(Sq as Shape)</T>
            {['drop', 'size = 4', 'align = 4', 'area → Sq::area'].map((r, i) => (
              <Box key={r} x={268} y={68 + i * 24} w={124} h={22} r={2}
                fill={i === 3 && (h('slot') || h('call')) ? tok('brand', 0.25) : tok('panel')} stroke={i === 3 && (h('slot') || h('call')) ? tok('brand') : tok('line')}>
                <T x={274} y={79 + i * 24} size={11} mono>{`+${i * 8} ${r}`}</T>
              </Box>
            ))}
            {(h('vt') || h('slot')) && <Arrow x1={92} y1={50} x2={266} y2={78} bend={-0.2} color={tok('brand')} />}
            {(h('slot') || h('call')) && <Arrow x1={268} y1={152} x2={120} y2={150} bend={0.3} color={tok('danger')} />}
            {(h('slot') || h('call')) && <T x={110} y={166} size={11} fill={tok('danger')}>indirect call into Sq::area</T>}
          </g>
        )}
        {st.gen && (
          <g>
            <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>xs: &amp;[Sq], 4 bytes each, no pointers</T>
            {Array.from({ length: 8 }, (_, k) => (
              <Box key={k} x={8 + k * 48} y={22} w={44} h={26} r={3} fill={tok(k < 4 ? 'f1' : 'f2', 0.2)} stroke={tok(k < 4 ? 'f1' : 'f2')}>
                <T x={30 + k * 48} y={35} size={11} mono anchor="middle">{k + 1}</T>
              </Box>
            ))}
            <T x={100} y={66} size={11} anchor="middle" fill={tok('f1')}>xmm2: 4 at once</T>
            <T x={292} y={66} size={11} anchor="middle" fill={tok('f2')}>xmm3: 4 more</T>
            <Box x={8} y={84} w={384} h={40} r={4} fill={tok('safe', 0.1)} stroke={tok('safe')}>
              <T x={200} y={98} size={12} anchor="middle">x * x for 4 lanes, then add 4 lanes</T>
              <T x={200} y={114} size={11} anchor="middle" fill={tok('muted')}>the body of Sq::area, inlined</T>
            </Box>
            <T x={200} y={150} size={12} anchor="middle" weight={700}>8 shapes per trip, 0 calls</T>
          </g>
        )}
      </Svg>
    </StepFrame>
  );
}
