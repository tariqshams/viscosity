# viscosity: ps=soa
from dataclasses import dataclass

@dataclass
class P:
    x: float
    tag: float

ps = []
for i in range(200):
    ps.append(P(i * 1.0, 1 if i % 2 else 1.0))
for p in ps:
    p.x += 1.0
print(ps[1].tag, ps[2].tag, ps[3].x)
