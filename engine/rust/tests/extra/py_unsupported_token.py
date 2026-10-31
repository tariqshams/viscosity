# viscosity: a complex literal is outside the subset, so nothing changes
from dataclasses import dataclass

@dataclass
class P:
    x: float

ps = []
for i in range(100):
    ps.append(P(i * 1.0))
z = 3j
for p in ps:
    p.x += 1.0
print(ps[1].x, z)
