import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

function Station({ x, y, w, text, note }: { x: number; y: number; w: number; text: string; note?: string }) {
  return (
    <g>
      <Box x={x} y={y - 14} w={w} h={28} r={14} fill={tok('brand', 0.1)} stroke={tok('brand')}>
        <T x={x + w / 2} y={y + 0.5} size={12} mono weight={700} anchor="middle">{text}</T>
      </Box>
      {note && <T x={x + w / 2} y={y + 26} size={11} anchor="middle" fill={tok('muted')}>{note}</T>}
    </g>
  );
}

/** The JSON number grammar as a railway: follow any track from left to right. */
export default function NumberRails() {
  const line = (x1: number, y1: number, x2: number, y2: number, dash?: boolean) => (
    <path d={`M${x1},${y1} L${x2},${y2}`} stroke={tok('ink', 0.6)} strokeWidth={2} fill="none" strokeDasharray={dash ? '5 4' : undefined} />
  );
  const skip = (x1: number, x2: number, y: number, h = 34) => (
    <path d={`M${x1},${y} C${x1 + 10},${y - h} ${x2 - 10},${y - h} ${x2},${y}`} stroke={tok('ink', 0.45)} strokeWidth={1.5} fill="none" strokeDasharray="5 4" />
  );
  return (
    <Svg w={400} h={250} title="The JSON number grammar as a railway, read left to right in two rows. Row one, the integer part: an optional minus sign, then either a single 0, or a digit from 1 to 9 followed by any number of digits. Row two: an optional fraction, a point followed by one or more digits; then an optional exponent, e or E, an optional plus or minus sign, and one or more digits. Dashed tracks skip the optional parts.">
      <T x={6} y={12} size={11} weight={700} fill={tok('muted')}>1. SIGN AND WHOLE PART</T>
      {line(6, 70, 40, 70)}
      {skip(30, 96, 70)}
      <Station x={40} y={70} w={44} text="-" note="optional" />
      {line(84, 70, 120, 70)}
      {line(120, 70, 140, 46)}
      {line(120, 70, 140, 94)}
      <Station x={140} y={46} w={44} text="0" />
      <Station x={140} y={94} w={60} text="1-9" />
      {line(200, 94, 222, 94)}
      <Station x={222} y={94} w={60} text="0-9" />
      <path d="M282,94 C300,94 300,124 252,124 C206,124 206,94 222,94" stroke={tok('ink', 0.45)} strokeWidth={1.5} fill="none" strokeDasharray="5 4" />
      <T x={252} y={136} size={11} anchor="middle" fill={tok('muted')}>repeat, or none</T>
      {line(184, 46, 320, 46)}
      {line(282, 94, 320, 94)}
      {line(320, 46, 320, 94)}
      <Arrow x1={320} y1={70} x2={394} y2={70} color={tok('ink', 0.6)} />
      <T x={356} y={60} size={11} anchor="middle" fill={tok('muted')}>to row 2</T>
      <T x={6} y={160} size={11} weight={700} fill={tok('muted')}>2. FRACTION AND EXPONENT, BOTH OPTIONAL</T>
      {line(6, 210, 30, 210)}
      {skip(20, 156, 210)}
      <Station x={30} y={210} w={36} text="." />
      {line(66, 210, 80, 210)}
      <Station x={80} y={210} w={66} text="0-9 …" note="one or more" />
      {line(146, 210, 168, 210)}
      {skip(160, 388, 210, 50)}
      {skip(226, 290, 210, 24)}
      <Station x={168} y={210} w={50} text="e E" />
      {line(218, 210, 232, 210)}
      <Station x={232} y={210} w={50} text="+ -" note="optional" />
      {line(282, 210, 296, 210)}
      <Station x={296} y={210} w={66} text="0-9 …" note="one or more" />
      <Arrow x1={362} y1={210} x2={394} y2={210} color={tok('ink', 0.6)} />
    </Svg>
  );
}
