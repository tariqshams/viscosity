import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

/** One Drip syntax error, taken apart: where it is reported, what the
 *  grammar needed, and what was there instead. */
export default function ErrorAnatomy() {
  const cw = 8.4; // width of one mono character at size 14
  const x0 = 34;
  return (
    <Svg w={400} h={262} title="The program let x = 1, newline, print x semicolon. The parser notices the problem at the token print on line 2, and reports it on line 1, where the missing semicolon belongs. The message has three parts: line 1, expected semicolon after the variable declaration, and found print.">
      <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>THE SOURCE</T>
      <T x={14} y={36} size={12} mono fill={tok('muted')}>1</T>
      <T x={x0} y={36} size={14} mono>let x = 1</T>
      <Box x={x0 + 9 * cw + 2} y={26} w={14} h={20} dash fill={tok('safe', 0.12)} stroke={tok('safe')} />
      <T x={14} y={66} size={12} mono fill={tok('muted')}>2</T>
      <Box x={x0 - 3} y={55} w={5 * cw + 6} h={22} fill={tok('danger', 0.14)} stroke={tok('danger')} />
      <T x={x0} y={66} size={14} mono>print x;</T>

      <T x={x0} y={90} size={11} fill={tok('danger')} weight={700}>noticed here: ';' was needed,</T>
      <T x={x0} y={104} size={11} fill={tok('danger')} weight={700}>'print' arrived</T>
      <Arrow x1={x0 + 9 * cw + 30} y1={60} x2={x0 + 9 * cw + 18} y2={42} color={tok('safe')} bend={0.4} />
      <T x={x0 + 9 * cw + 30} y={36} size={11} fill={tok('safe')} weight={700}>reported here,</T>
      <T x={x0 + 9 * cw + 30} y={50} size={11} fill={tok('safe')} weight={700}>where the ; belongs</T>

      <T x={8} y={130} size={11} weight={700} fill={tok('muted')}>THE MESSAGE, PART BY PART</T>
      {[
        { y: 142, text: 'line 1:', label: 'where', c: 'safe' },
        { y: 182, text: "expected ';' after the variable declaration,", label: 'what the grammar needed', c: 'brand' },
        { y: 222, text: "found 'print'", label: 'what was there instead', c: 'danger' },
      ].map((p) => (
        <g key={p.y}>
          <Box x={8} y={p.y} w={384} h={34} fill={tok(p.c, 0.08)} stroke={tok(p.c)}>
            <T x={16} y={p.y + 12} size={10.5} weight={700} fill={tok(p.c)}>{p.label}</T>
            <T x={16} y={p.y + 25} size={11.5} mono>{p.text}</T>
          </Box>
        </g>
      ))}
    </Svg>
  );
}
