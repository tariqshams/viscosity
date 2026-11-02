export default {
  id: 'II', track: 'A', days: '12–16', title: 'How machines run code',
  blurb: 'Memory, CPU caches and cache lines, prefetching, SIMD, how JavaScript stores numbers and objects, AoS vs SoA measured, and how to benchmark honestly.',
  chapters: [
    { n: 48, title: 'Memory is one long array', introduces: {
      memory: 'RAM as one enormous array of bytes',
      address: 'a byte’s index in memory',
      contiguous: 'values stored side by side with no gaps',
    } },
    { n: 49, title: 'Pointers, the stack and the heap', introduces: {
      pointer: 'a stored address',
      'stack-and-heap': 'the call stack vs the heap where objects live',
    } },
    { n: 50, title: 'The CPU and its caches', introduces: {
      cpu: 'the processor: fetch, decode, execute',
      register: 'tiny storage inside the CPU',
      'cpu-cache': 'small fast memory between CPU and RAM',
    } },
    { n: 51, title: 'Cache levels, latency and misses', introduces: {
      'cache-hierarchy': 'L1, L2, L3 and main memory',
      latency: 'how long one access takes',
      'cache-miss': 'needed data not in cache',
    } },
    { n: 52, title: 'Cache lines and locality', introduces: {
      'cache-line': 'memory moves in 64-byte blocks',
      'spatial-locality': 'using data near data you just used',
      stride: 'the gap between consecutive accesses',
    } },
    { n: 53, title: 'Reuse and bandwidth', introduces: {
      'temporal-locality': 'using the same data again soon',
      bandwidth: 'how many bytes per second can flow',
    } },
    { n: 54, title: 'Prefetching and pointer chasing', introduces: {
      prefetcher: 'hardware that fetches data before you ask',
      'pointer-chasing': 'following references the prefetcher can’t predict',
    } },
    { n: 55, title: 'Pipelines and branch prediction', introduces: {
      pipeline: 'the CPU working on many instructions at once',
      'branch-prediction': 'the CPU guessing which way an if goes',
    } },
    { n: 56, title: 'SIMD: one instruction, many numbers', introduces: {
      simd: 'single instruction, multiple data', vectorization: 'turning a loop into SIMD instructions', lane: 'one slot of a SIMD register' } },
    { n: 57, title: 'How JavaScript stores numbers and objects', introduces: {
      ieee754: 'the IEEE 754 double format',
      smi: 'small integers stored directly in a pointer-sized slot',
      'heap-number': 'a double boxed on the heap',
      'object-header': 'the hidden fields at the start of every object',
    } },
    { n: 58, title: 'Field representations: one TypeScript line, a slower loop', introduces: {
      'field-representation': 'how an engine stores a field: Smi, double or tagged',
    } },
    { n: 59, title: 'AoS vs SoA, measured', introduces: {
      'aos-vs-soa': 'the trade-off between record-oriented and field-oriented layouts',
      'hot-cold-split': 'separating often-used fields from rarely used ones',
    } },
    { n: 60, title: 'When SoA loses: materialization and AoSoA', introduces: {
      materialization: 'rebuilding an object from columns',
      aosoa: 'blocks of SoA: array of structs of arrays',
    } },
    { n: 61, title: 'Benchmarking honestly', introduces: {
      'jit-warmup': 'code gets faster as the engine optimizes it',
      'dead-code-elimination': 'the compiler deleting work whose result is unused',
    } },
    { n: 62, title: 'Noisy numbers: the median, p95 and a fresh process', introduces: {
      'median-p95': 'robust summaries of noisy timings',
      'benchmark-isolation': 'one fresh process per measurement',
    } },
  ],
};
