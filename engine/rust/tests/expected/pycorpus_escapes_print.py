# viscosity: ps=aos
from dataclasses import dataclass

@dataclass
class P:
    x: float

ps = []
for i in range(100):
    ps.append(P(i * 1.0))
for i in range(len(ps)):
    ps[i].x += 1.0
print(ps[0])
