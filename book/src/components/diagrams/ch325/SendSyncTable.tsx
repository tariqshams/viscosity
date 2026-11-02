import { Box, Svg, T, tok } from '../../viz/svg';

// Send and Sync for common types (std 1.97). Static.

const ROWS: [string, boolean, boolean, string][] = [
  ['i32, f64, bool', true, true, 'plain values'],
  ['String, Vec<T>, Box<T>', true, true, 'if T is'],
  ['&T', true, true, 'Send if T: Sync'],
  ['Rc<T>', false, false, 'count not atomic'],
  ['Cell<T>, RefCell<T>', true, false, 'unsynced mutation'],
  ['Arc<T>', true, true, 'if T: Send + Sync'],
  ['Mutex<T>', true, true, 'if T: Send'],
  ['AtomicU32, AtomicUsize', true, true, 'atomic ops'],
  ['*const T, *mut T', false, false, 'raw pointers'],
];

const mark = (ok: boolean, x: number, y: number) => (
  <T x={x} y={y} size={14} weight={700} anchor="middle" fill={tok(ok ? 'safe' : 'danger')}>{ok ? '✓' : '✗'}</T>
);

export default function SendSyncTable() {
  const rowH = 26;
  return (
    <Svg w={400} h={36 + ROWS.length * rowH} title="Which common types are Send and which are Sync">
      <T x={8} y={14} size={11} weight={700} fill={tok('muted')}>TYPE</T>
      <T x={206} y={14} size={11} weight={700} anchor="middle" fill={tok('muted')}>Send</T>
      <T x={250} y={14} size={11} weight={700} anchor="middle" fill={tok('muted')}>Sync</T>
      <T x={392} y={14} size={11} weight={700} anchor="end" fill={tok('muted')}>WHY</T>
      {ROWS.map(([ty, send, sync, why], i) => {
        const y = 24 + i * rowH;
        const bad = !send || !sync;
        return (
          <g key={ty}>
            <Box x={8} y={y} w={384} h={rowH - 4} r={3} fill={bad ? tok('danger', 0.06) : tok('panel')} stroke={tok('line')}>
              <T x={14} y={y + (rowH - 4) / 2} size={11} mono>{ty}</T>
              {mark(send, 206, y + (rowH - 4) / 2)}
              {mark(sync, 250, y + (rowH - 4) / 2)}
              <T x={386} y={y + (rowH - 4) / 2} size={11} anchor="end" fill={tok('muted')}>{why}</T>
            </Box>
          </g>
        );
      })}
    </Svg>
  );
}
