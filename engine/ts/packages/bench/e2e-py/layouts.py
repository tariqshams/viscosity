"""Python layout benchmark (book chapter 116): is column storage worth it in
CPython? Measures time per element for the same update loop over
dataclass objects, array('d') columns and list columns, and memory for
objects vs columns. Prints one JSON object."""
import json, platform, time, tracemalloc
from array import array
from dataclasses import dataclass

@dataclass
class P:
    x: float
    y: float
    vx: float
    vy: float

N = 100_000
REPS = 20

def timed(fn):
    fn()  # warm up
    best = float('inf')
    for _ in range(5):
        t = time.perf_counter()
        for _ in range(REPS):
            fn()
        best = min(best, time.perf_counter() - t)
    return best / (REPS * N) * 1e9  # ns per element

ps = [P(i * 0.5, 0.0, 1.0, -1.0) for i in range(N)]
xs, vxs = array('d', (i * 0.5 for i in range(N))), array('d', [1.0]) * N
xl, vxl = [i * 0.5 for i in range(N)], [1.0] * N

def objects():
    for p in ps:
        p.x += p.vx * 0.016
def typed_columns():
    for i in range(N):
        xs[i] += vxs[i] * 0.016
def list_columns():
    for i in range(N):
        xl[i] += vxl[i] * 0.016

result = {
    'python': platform.python_version(),
    'implementation': platform.python_implementation(),
    'n': N,
    'ns_per_element': {f.__name__: round(timed(f), 2) for f in (objects, typed_columns, list_columns)},
}
del ps, xs, vxs, xl, vxl
tracemalloc.start()
objs = [P(i * 0.5, i * 0.25, 1.5, -1.5) for i in range(N)]
mem_objects = tracemalloc.get_traced_memory()[0]
tracemalloc.stop()
del objs
tracemalloc.start()
cols = [array('d', (i * 0.5 for i in range(N))) for _ in range(4)]
mem_columns = tracemalloc.get_traced_memory()[0]
tracemalloc.stop()
result['memory_bytes'] = {'objects': mem_objects, 'typed_columns': mem_columns}
print(json.dumps(result))
