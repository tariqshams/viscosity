export default {
  id: 'II', track: 'A', days: '5–6', title: 'How machines run code',
  blurb: 'Memory, CPU caches and cache lines, prefetching, SIMD, how JavaScript stores numbers and objects, AoS vs SoA measured, and how to benchmark honestly.',
  chapters: [
    { n: 17, title: 'Memory is one long array', introduces: {
      memory: 'RAM as one enormous array of bytes', address: 'a byte’s index in memory', pointer: 'a stored address',
      'stack-and-heap': 'the call stack vs the heap where objects live', 'contiguous': 'values stored side by side with no gaps' } },
    { n: 18, title: 'The CPU and its caches', introduces: {
      cpu: 'the processor: fetch, decode, execute', register: 'tiny storage inside the CPU', 'cpu-cache': 'small fast memory between CPU and RAM',
      'cache-hierarchy': 'L1, L2, L3 and main memory', latency: 'how long one access takes', 'cache-miss': 'needed data not in cache' } },
    { n: 19, title: 'Cache lines and locality', introduces: {
      'cache-line': 'memory moves in 64-byte blocks', 'spatial-locality': 'using data near data you just used',
      'temporal-locality': 'using the same data again soon', stride: 'the gap between consecutive accesses', bandwidth: 'how many bytes per second can flow' } },
    { n: 20, title: 'Prefetching and branch prediction', introduces: {
      prefetcher: 'hardware that fetches data before you ask', 'branch-prediction': 'the CPU guessing which way an if goes',
      pipeline: 'the CPU working on many instructions at once', 'pointer-chasing': 'following references the prefetcher can’t predict' } },
    { n: 21, title: 'SIMD: one instruction, many numbers', introduces: {
      simd: 'single instruction, multiple data', vectorization: 'turning a loop into SIMD instructions', lane: 'one slot of a SIMD register' } },
    { n: 22, title: 'How JavaScript stores numbers and objects', introduces: {
      ieee754: 'the IEEE 754 double format', smi: 'small integers stored directly in a pointer-sized slot', 'heap-number': 'a double boxed on the heap',
      'object-header': 'the hidden fields at the start of every object', 'field-representation': 'how an engine stores a field: Smi, double or tagged' } },
    { n: 23, title: 'AoS vs SoA, measured', introduces: {
      'aos-vs-soa': 'the trade-off between record-oriented and field-oriented layouts', aosoa: 'blocks of SoA: array of structs of arrays',
      'hot-cold-split': 'separating often-used fields from rarely used ones', materialization: 'rebuilding an object from columns' } },
    { n: 24, title: 'Benchmarking honestly', introduces: {
      'jit-warmup': 'code gets faster as the engine optimizes it', 'dead-code-elimination': 'the compiler deleting work whose result is unused',
      'median-p95': 'robust summaries of noisy timings', 'benchmark-isolation': 'one fresh process per measurement' } },
  ],
};
