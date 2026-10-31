import { Box, Svg, T, tok } from '../../viz/svg';

const S = 'cat 42';

/** A string as a row of characters, each with an index and a char code. */
export default function CharCodes() {
  const chars = [...S];
  return (
    <Svg w={400} h={176} title="The string 'cat 42' has six characters at indexes 0 to 5. Their char codes are 99, 97, 116, 32, 52 and 50. Even the space has a code.">
      <T x={8} y={14} size={14} mono weight={700}>s = 'cat 42'</T>
      <T x={392} y={14} size={12} anchor="end" fill={tok('muted')}>s.length: 6</T>
      <T x={8} y={52} size={11} weight={700} fill={tok('muted')}>s[i]</T>
      <T x={8} y={100} size={11} weight={700} fill={tok('muted')}>index</T>
      <T x={8} y={136} size={11} weight={700} fill={tok('muted')}>code</T>
      {chars.map((c, i) => {
        const x = 52 + i * 57;
        const digit = c >= '0' && c <= '9';
        return (
          <g key={i}>
            <Box x={x} y={30} w={50} h={44} fill={digit ? tok('brand', 0.14) : tok('panel')} stroke={digit ? tok('brand') : tok('ink', 0.45)}>
              <T x={x + 25} y={52} size={20} mono weight={600} anchor="middle">{c === ' ' ? '␣' : c}</T>
            </Box>
            <T x={x + 25} y={100} size={13} mono anchor="middle" fill={tok('muted')}>{i}</T>
            <Box x={x} y={120} w={50} h={32} fill={tok('accent', 0.1)} stroke={tok('accent')}>
              <T x={x + 25} y={136} size={14} mono anchor="middle">{c.charCodeAt(0)}</T>
            </Box>
          </g>
        );
      })}
      <T x={200} y={168} size={12} anchor="middle" fill={tok('muted')}>s.charCodeAt(4) → 52, the code for the character '4'</T>
    </Svg>
  );
}
