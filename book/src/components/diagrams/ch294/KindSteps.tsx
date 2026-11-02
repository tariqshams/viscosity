import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 294: Python int and float facts for the corpus program
// ints_stay_ints.py, from compute / compute_int / field_stays_numeric in
// engine/rust/crates/core/src/analysis.rs. The VIR is a real print_func
// listing of the program, trimmed to the values that matter; the # notes
// are added.
const VIR = `%6  = phi %4, %14        # i
%10 = binop / %6, %9     # i / 2
%11 = record {count, weight} %6, %10
%22 = field.get %21 .count
%24 = binop + %22, %23   # + 1
      field.set %21, %24 .count
%28 = field.get %27 .weight
%30 = binop * %28, %29   # * 2
      field.set %27, %30 .weight`;

type Kind = 'int' | 'float' | 'neither' | '?';
type S = { line: number | null; count: string; weight: string; facts: [string, Kind][]; note: string };

const STATES: S[] = [
  { line: 0, count: 'float?', weight: 'float?', facts: [['%6', 'int']], note: 'i counts from the int 0 by the int 1. compute_int: + of two ints is an int, and the phi of ints is an int. compute: no float involved, so %6 is not “numeric” (in Python that means float).' },
  { line: 1, count: 'float?', weight: 'float?', facts: [['%6', 'int'], ['%10', 'float']], note: 'i / 2: true division of two numbers is always a float in Python, even for two ints (6 / 2 is 3.0). So %10 is numeric.' },
  { line: 2, count: 'list', weight: 'float?', facts: [['%6', 'int'], ['%10', 'float']], note: 'The record’s count argument is %6, an int. field_stays_numeric needs every record to put a float there, so count’s column fact drops to false.' },
  { line: 4, count: 'list', weight: 'float?', facts: [['%6', 'int'], ['%10', 'float'], ['%22', 'neither'], ['%24', 'neither']], note: 'count += 1 reads the field (not provably a float now) and adds an int. Neither side is a float, so neither is the sum. count was already lost.' },
  { line: 7, count: 'list', weight: 'float', facts: [['%6', 'int'], ['%10', 'float'], ['%28', 'float'], ['%30', 'float']], note: 'weight *= 2: %28 reads weight, still optimistically float. float * int is a float, so the write keeps weight numeric. The next round agrees: a fixpoint.' },
  { line: null, count: 'list', weight: 'float', facts: [['%6', 'int'], ['%10', 'float'], ['%30', 'float']], note: 'numeric_fields = {weight}. Real explain: “typed array(\'d\') columns for weight; list columns for count (may hold non-floats)”. The program prints type(cs[5].count).__name__, and it must still say int.' },
];

const COLOUR: Record<Kind, string> = { int: 'accent', float: 'safe', neither: 'muted', '?': 'muted' };

export default function KindSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const col = (label: string, v: string, x: number, colour: string) => {
    const typed = v === 'float';
    const lost = v === 'list';
    return (
      <Box x={x} y={98} w={180} h={36} fill={typed ? tok(colour, 0.16) : lost ? tok('danger', 0.1) : tok('panel')} stroke={typed ? tok(colour) : lost ? tok('danger') : tok('line')} dash={v === 'float?'}>
        <T x={x + 8} y={110} size={11} weight={700} fill={tok(colour)}>{label}</T>
        <T x={x + 8} y={125} size={11.5} mono>{typed ? "array('d')" : lost ? 'list column' : 'float? (optimistic)'}</T>
      </Box>
    );
  };
  return (
    <StepFrame title="Ints, floats and a typed column" steps={s} note={st.note}>
      <CodeTrace code={VIR} line={st.line} />
      <Svg w={400} h={144} title="The int and float facts of a few values, and the column each field gets">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>FACTS</T>
        {st.facts.map(([v, k], i) => (
          <Box key={v} x={8 + i * 96} y={24} w={88} h={26} fill={tok(COLOUR[k], 0.14)} stroke={tok(COLOUR[k])}>
            <T x={14 + i * 96} y={37} size={12} mono weight={700}>{v}</T>
            <T x={88 + i * 96} y={37} size={11.5} anchor="end" fill={tok(COLOUR[k])}>{k}</T>
          </Box>
        ))}
        <T x={8} y={84} size={11} weight={700} fill={tok('muted')}>COLUMNS</T>
        {col('count', st.count, 8, 'brand')}
        {col('weight', st.weight, 206, 'brand')}
      </Svg>
    </StepFrame>
  );
}
