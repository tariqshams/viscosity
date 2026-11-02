import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const ROWS = [
  { rule: 'value = string / number / …', fn: 'parseValue', what: 'one if per kind' },
  { rule: 'array = "[" values "]"', fn: 'parseArray', what: 'loop of parseValue' },
  { rule: 'object = "{" members "}"', fn: 'parseObject', what: 'loop: key : value' },
];

/** Each grammar rule becomes one function, and a rule that mentions value calls parseValue. */
export default function GrammarCode() {
  return (
    <Svg w={400} h={232} title="Three grammar rules on the left and three functions on the right. The value rule becomes parseValue, one if per kind of token; the array rule becomes parseArray, a loop that calls parseValue for each element; the object rule becomes parseObject, a loop of key, colon and parseValue. Arrows from parseArray and parseObject back to parseValue show the recursion: a value can contain values.">
      <T x={6} y={12} size={11} weight={700} fill={tok('muted')}>GRAMMAR RULE</T>
      <T x={240} y={12} size={11} weight={700} fill={tok('muted')}>FUNCTION</T>
      {ROWS.map((r, k) => {
        const y = 26 + k * 62;
        return (
          <g key={r.fn}>
            <Box x={4} y={y} w={196} h={44} fill={tok('panel')} stroke={tok('line')}>
              <T x={12} y={y + 22} size={11} mono>{r.rule}</T>
            </Box>
            <Arrow x1={202} y1={y + 22} x2={238} y2={y + 22} color={tok('ink', 0.6)} />
            <Box x={240} y={y} w={130} h={44} fill={tok('brand', 0.1)} stroke={tok('brand')}>
              <T x={250} y={y + 15} size={12} mono weight={700}>{r.fn}</T>
              <T x={250} y={y + 32} size={11} fill={tok('muted')}>{r.what}</T>
            </Box>
          </g>
        );
      })}
      <path d="M370,110 C392,110 392,52 372,52" stroke={tok('f2')} strokeWidth={2} fill="none" />
      <path d="M370,172 C398,172 398,44 372,44" stroke={tok('f2')} strokeWidth={2} fill="none" strokeDasharray="5 4" />
      <T x={200} y={218} size={11} anchor="middle" fill={tok('f2')} weight={700}>the arrays and objects call parseValue again: recursion</T>
    </Svg>
  );
}
