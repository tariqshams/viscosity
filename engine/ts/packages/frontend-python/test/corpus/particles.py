# viscosity: ps=soa
from dataclasses import dataclass
import math

@dataclass
class Particle:
    x: float
    y: float
    vx: float
    vy: float
    name: str

ps = []
for i in range(2000):
    ps.append(Particle(i * 0.5, 0.0, 1.0, -1.0, "p" + str(i)))

def step(arr, dt):
    for i in range(len(arr)):
        p = arr[i]
        p.x += p.vx * dt
    for q in arr:
        q.y = q.y + q.vy * dt

for k in range(10):
    step(ps, 0.016)
total = 0.0
for p in ps:
    total += math.sqrt(p.x * p.x + p.y * p.y)
print(round(total, 6), ps[3].name, ps[1999].x, len(ps))
