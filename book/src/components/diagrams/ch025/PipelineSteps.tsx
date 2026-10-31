import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const SRC = 'print 1 + 2 * 3;';
const STAGES = ['source', 'tokens', 'tree', 'bytecode', 'output'] as const;
type Stage = (typeof STAGES)[number];
type View = 'chars' | 'tokens' | 'tree' | 'walk' | 'bytecode' | 'halves';

type S = { view: View; on: Stage[]; skip?: boolean; note: string };

const STATES: S[] = [
  { view: 'chars', on: ['source'], note: 'This is all Drip gets: a string of 16 characters. To the computer, “print” is not a word yet. It is the letters p, r, i, n and t, one after another.' },
  { view: 'tokens', on: ['source', 'tokens'], note: 'The scanner reads the characters left to right and groups them into tokens: the keyword print, the number 1, the operator +, and so on. Spaces are dropped. A final eof token marks the end.' },
  { view: 'tree', on: ['tokens', 'tree'], note: 'The parser arranges the tokens into a tree. * sits below +, because 2 * 3 must be worked out first. Nothing has been computed yet: this is still only a description of the program.' },
  { view: 'walk', on: ['tree', 'output'], skip: true, note: 'Route 1, the tree-walking interpreter: visit the tree from the bottom up. 2 * 3 gives 6, then 1 + 6 gives 7, then print shows 7. This is the route Part III builds.' },
  { view: 'bytecode', on: ['tree', 'bytecode'], note: 'Route 2, a compiler: translate the program into a list of simple instructions, called bytecode. Nothing runs yet. The list just says what to do, in order. (Drip’s real VM goes straight from tokens to bytecode, with no tree, as Part IV explains.)' },
  { view: 'bytecode', on: ['bytecode', 'output'], note: 'Then a small virtual machine runs the instructions: push 1, push 2, push 3, multiply the top two (6), add the top two (7), print. Same answer, by a different road.' },
  { view: 'halves', on: ['source', 'tokens', 'tree', 'bytecode', 'output'], note: 'The stages that understand the program (scanning, parsing) form the front end. The stages that make it happen (walking the tree, or compiling and running bytecode) form the back end.' },
];

const BW = 68;
const sx = (k: number) => 6 + k * 79;

function Node({ x, y, label, value, leaf }: { x: number; y: number; label: string; value?: string; leaf?: boolean }) {
  return (
    <g>
      <Box x={x - 26} y={y - 15} w={52} h={30} r={8} fill={leaf ? tok('panel') : tok('brand', 0.12)} stroke={leaf ? tok('ink', 0.45) : tok('brand')}>
        <T x={x} y={y} size={14} mono weight={700} anchor="middle">{label}</T>
      </Box>
      {value && <T x={x + 32} y={y - 14} size={13} mono weight={700} fill={tok('accent')}>= {value}</T>}
    </g>
  );
}

function Tree({ values }: { values: boolean }) {
  return (
    <g>
      <Arrow x1={200} y1={88} x2={200} y2={106} width={1.5} />
      <Arrow x1={190} y1={136} x2={128} y2={160} width={1.5} />
      <Arrow x1={210} y1={136} x2={272} y2={160} width={1.5} />
      <Arrow x1={262} y1={190} x2={222} y2={212} width={1.5} />
      <Arrow x1={282} y1={190} x2={322} y2={212} width={1.5} />
      <Node x={200} y={74} label="print" value={values ? '7' : undefined} />
      <Node x={200} y={121} label="+" value={values ? '7' : undefined} />
      <Node x={118} y={175} label="1" leaf />
      <Node x={272} y={175} label="*" value={values ? '6' : undefined} />
      <Node x={212} y={227} label="2" leaf />
      <Node x={332} y={227} label="3" leaf />
      {values && <T x={20} y={227} size={13} mono weight={700} fill={tok('accent')}>output: 7</T>}
    </g>
  );
}

const TOKS: [string, string][] = [['print', 'print'], ['number', '1'], ['+', '+'], ['number', '2'], ['*', '*'], ['number', '3'], [';', ';'], ['eof', '']];
const CODE = ['CONSTANT 1', 'CONSTANT 2', 'CONSTANT 3', 'MULTIPLY', 'ADD', 'PRINT'];

export default function PipelineSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="One line of Drip, from text to 7" steps={s} note={st.note}>
      <Svg w={400} h={252} title="The stages source, tokens, tree, bytecode and output, with the current stage's contents for the Drip line print 1 + 2 * 3;">
        {STAGES.map((name, k) => {
          const on = st.on.includes(name);
          return (
            <g key={name}>
              <Box x={sx(k)} y={6} w={BW} h={28} r={6} fill={on ? tok('brand', 0.16) : tok('panel')} stroke={on ? tok('brand') : tok('ink', 0.3)} dash={st.skip && name === 'bytecode'}>
                <T x={sx(k) + BW / 2} y={20} size={12} weight={on ? 700 : 400} anchor="middle" fill={on ? tok('ink') : tok('muted')}>{name}</T>
              </Box>
              {k < 4 && <Arrow x1={sx(k) + BW + 1} y1={20} x2={sx(k + 1) - 1} y2={20} width={1.5} color={tok('ink', 0.4)} />}
            </g>
          );
        })}
        {st.skip && <Arrow x1={sx(2) + BW / 2} y1={38} x2={sx(4) + BW / 2} y2={38} bend={0.35} width={1.5} color={tok('accent')} />}

        {st.view === 'chars' && (
          <g>
            {[...SRC].map((c, k) => (
              <g key={k}>
                <Box x={16 + k * 23} y={90} w={21} h={34} r={3} fill={c === ' ' ? tok('panel') : tok('brand', 0.08)} stroke={tok('ink', 0.35)}>
                  <T x={16 + k * 23 + 10.5} y={107} size={15} mono anchor="middle">{c === ' ' ? '␣' : c}</T>
                </Box>
                <T x={16 + k * 23 + 10.5} y={136} size={9} mono anchor="middle" fill={tok('muted')}>{k}</T>
              </g>
            ))}
            <T x={200} y={176} size={13} anchor="middle" fill={tok('muted')}>a string: 16 characters, numbered 0 to 15</T>
          </g>
        )}

        {st.view === 'tokens' && TOKS.map(([type, lex], k) => {
          const x = 14 + (k % 4) * 94;
          const y = 70 + Math.floor(k / 4) * 74;
          return (
            <Box key={k} x={x} y={y} w={84} h={56} r={6} fill={type === 'eof' ? tok('panel') : tok('accent', 0.1)} stroke={type === 'eof' ? tok('ink', 0.4) : tok('accent')}>
              <T x={x + 42} y={y + 18} size={11} mono anchor="middle" fill={tok('muted')}>{type}</T>
              <T x={x + 42} y={y + 38} size={17} mono weight={700} anchor="middle">{lex || '·'}</T>
            </Box>
          );
        })}
        {st.view === 'tokens' && <T x={200} y={228} size={13} anchor="middle" fill={tok('muted')}>8 tokens: a type, plus the characters they came from</T>}

        {st.view === 'tree' && <Tree values={false} />}
        {st.view === 'walk' && <Tree values />}

        {st.view === 'bytecode' && (
          <g>
            {CODE.map((c, k) => (
              <g key={c}>
                <T x={60} y={70 + k * 26} size={11} mono fill={tok('muted')}>{String(k).padStart(2, '0')}</T>
                <T x={90} y={70 + k * 26} size={15} mono weight={700}>{c}</T>
              </g>
            ))}
            {st.on.includes('output') && <T x={260} y={200} size={13} mono weight={700} fill={tok('accent')}>output: 7</T>}
          </g>
        )}

        {st.view === 'halves' && (
          <g>
            <Box x={sx(0)} y={52} w={sx(2) + BW - sx(0)} h={40} r={6} fill={tok('brand', 0.1)} stroke={tok('brand')}>
              <T x={(sx(0) + sx(2) + BW) / 2} y={72} size={14} weight={700} anchor="middle" fill={tok('brand')}>FRONT END</T>
            </Box>
            <Box x={sx(3)} y={52} w={sx(4) + BW - sx(3)} h={40} r={6} fill={tok('accent', 0.1)} stroke={tok('accent')}>
              <T x={(sx(3) + sx(4) + BW) / 2} y={72} size={14} weight={700} anchor="middle" fill={tok('accent')}>BACK END</T>
            </Box>
            <T x={(sx(0) + sx(2) + BW) / 2} y={116} size={12} anchor="middle" fill={tok('muted')}>understands the program</T>
            <T x={(sx(0) + sx(2) + BW) / 2} y={134} size={12} anchor="middle" fill={tok('muted')}>depends on the source language</T>
            <T x={(sx(3) + sx(4) + BW) / 2} y={116} size={12} anchor="middle" fill={tok('muted')}>makes it happen</T>
            <T x={(sx(3) + sx(4) + BW) / 2} y={134} size={12} anchor="middle" fill={tok('muted')}>depends on the target</T>
            <T x={200} y={190} size={13} anchor="middle">The tree is where the two halves meet.</T>
          </g>
        )}
      </Svg>
    </StepFrame>
  );
}
