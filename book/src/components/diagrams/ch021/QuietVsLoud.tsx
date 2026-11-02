import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

/** Two ways a function can fail: return a wrong value that travels on, or throw and stop. */
export default function QuietVsLoud() {
  const lane = (y: number, items: { label: string; sub?: string; bad?: boolean; stop?: boolean }[]) =>
    items.map((it, k) => {
      const x = 4 + k * 100;
      const stroke = it.stop ? tok('danger') : it.bad ? tok('warn') : tok('ink', 0.45);
      const fill = it.stop ? tok('danger', 0.1) : it.bad ? tok('warn', 0.1) : tok('panel');
      return (
        <g key={k}>
          <Box x={x} y={y} w={88} h={44} r={6} stroke={stroke} fill={fill}>
            <T x={x + 44} y={y + (it.sub ? 15 : 22)} size={11.5} mono weight={700} anchor="middle">{it.label}</T>
            {it.sub && <T x={x + 44} y={y + 32} size={11} anchor="middle" fill={it.stop ? tok('danger') : tok('muted')}>{it.sub}</T>}
          </Box>
          {k < items.length - 1 && !it.stop && <Arrow x1={x + 89} y1={y + 22} x2={x + 99} y2={y + 22} width={1.5} />}
        </g>
      );
    });
  return (
    <Svg w={400} h={196} title="Above: toNumber returns 112 for the input 4x, and the wrong number flows on into a total and a chart. Below: toNumber throws, and the program stops at once with the message bad digit at 1.">
      <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>RETURN A STRANGE VALUE (quiet)</T>
      {lane(22, [
        { label: "'4x'", sub: 'the input' },
        { label: 'toNumber', sub: 'returns 112', bad: true },
        { label: 'total', sub: '112 + 30', bad: true },
        { label: 'chart', sub: 'wrong, later', bad: true },
      ])}
      <T x={392} y={82} size={11} anchor="end" fill={tok('warn')}>nobody knows where it went wrong</T>
      <T x={8} y={110} size={11} weight={700} fill={tok('muted')}>THROW (loud)</T>
      {lane(120, [
        { label: "'4x'", sub: 'the input' },
        { label: 'toNumber', sub: 'throws', stop: true },
      ])}
      <Box x={204} y={120} w={192} h={44} r={6} stroke={tok('danger')} fill={tok('danger', 0.06)} dash>
        <T x={300} y={135} size={11.5} mono weight={700} anchor="middle" fill={tok('danger')}>Error: bad digit at 1</T>
        <T x={300} y={152} size={11} anchor="middle" fill={tok('muted')}>total and chart never run</T>
      </Box>
      <Arrow x1={193} y1={142} x2={203} y2={142} width={1.5} color={tok('danger')} />
      <T x={392} y={182} size={11} anchor="end" fill={tok('danger')}>stopped right where the problem is</T>
    </Svg>
  );
}
