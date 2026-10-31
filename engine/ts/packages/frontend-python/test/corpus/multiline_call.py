# viscosity: ps=soa
# A bracket that closes on a continuation line.
from dataclasses import dataclass

@dataclass
class P:
    x: float
    vx: float

ps = []
for i in range(1000):
    ps.append(P(float(i),
                1.0))
for p in ps:
    p.x += p.vx
print(ps[0].x)
