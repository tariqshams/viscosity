# Particles in Python: 100k particles, the hot loop touches 2 of 5 fields.
import time
from dataclasses import dataclass

@dataclass
class P:
    x: float
    y: float
    vx: float
    vy: float
    m: float

ps = []
for i in range(100000):
    ps.append(P(i * 0.5, 0.0, 1.0, -1.0, 2.0))

def step(arr, dt):
    for p in arr:
        p.x += p.vx * dt

t0 = time.perf_counter()
for f in range(20):
    step(ps, 0.016)
ms = (time.perf_counter() - t0) * 1000
s = 0.0
for p in ps:
    s += p.x
print('{"check": "%.6f", "ms": %.1f}' % (s, ms))
