import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// The chapter The browser playground: the messages between Playground.tsx
// (rustCompiler) and play.worker.ts. A compile posts { compile, id }; the
// worker awaits loadRust() (the .wasm is fetched once), calls compile, and
// posts { id, res, ms }, or { id, error, fatal } when it throws; fatal is
// true for a WebAssembly.RuntimeError. On a fatal reply the page calls
// terminate(), answers every queued request with an error, and starts a
// fresh worker on the next compile.
export default function WorkerFlow() {
  return (
    <Svg w={400} h={236} title="The page sends compile requests to a worker that holds the Rust engine; a fatal reply replaces the worker">
      <Box x={6} y={8} w={120} h={216} fill={tok('brand', 0.08)} stroke={tok('brand')}>
        <T x={66} y={24} size={12} weight={700} anchor="middle">the page</T>
        <T x={14} y={48} size={11}>ticket = ++latest</T>
        <T x={14} y={104} size={11}>show if still</T>
        <T x={14} y={118} size={11}>the latest</T>
        <T x={14} y={168} size={11} fill={tok('danger')}>fatal: terminate(),</T>
        <T x={14} y={182} size={11} fill={tok('danger')}>start afresh</T>
      </Box>
      <Box x={274} y={8} w={120} h={216} fill={tok('panel')} stroke={tok('line')}>
        <T x={334} y={24} size={12} weight={700} anchor="middle">the worker</T>
        <T x={282} y={48} size={11}>await loadRust()</T>
        <T x={282} y={62} size={11} fill={tok('muted')}>(.wasm, once)</T>
        <T x={282} y={90} size={11}>m.compile(src)</T>
        <T x={282} y={148} size={11}>catch: is it a</T>
        <T x={282} y={162} size={11}>RuntimeError?</T>
      </Box>
      <Arrow x1={128} y1={56} x2={272} y2={56} />
      <T x={200} y={46} size={11} mono anchor="middle">{'{ compile, id }'}</T>
      <Arrow x1={272} y1={104} x2={128} y2={104} color={tok('safe')} />
      <T x={200} y={94} size={11} mono anchor="middle" fill={tok('safe')}>{'{ id, res, ms }'}</T>
      <Arrow x1={272} y1={168} x2={128} y2={168} color={tok('danger')} />
      <T x={200} y={158} size={11} mono anchor="middle" fill={tok('danger')}>{'{ id, error, fatal }'}</T>
      <T x={200} y={204} size={11} anchor="middle" fill={tok('muted')}>only messages cross;</T>
      <T x={200} y={218} size={11} anchor="middle" fill={tok('muted')}>nothing is shared</T>
    </Svg>
  );
}
