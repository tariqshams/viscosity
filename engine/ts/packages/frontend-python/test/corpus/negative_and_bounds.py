# viscosity: ps=soa
from dataclasses import dataclass

@dataclass
class P:
    x: float

ps = []
for i in range(100):
    ps.append(P(i * 1.0))
s = 0.0
for i in range(len(ps)):
    s += ps[i].x
print(s, ps[-1].x, ps[-100].x)
print(ps[100].x)
