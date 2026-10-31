# viscosity: ps=aos
# A default that is not a literal is evaluated once, at class definition.
from dataclasses import dataclass

K = 2.0

@dataclass
class P:
    x: float
    y: float = K

K = 3.0
ps = []
for i in range(100):
    ps.append(P(i * 1.0))
for p in ps:
    p.x += p.y
print(ps[0].y, ps[0].x)
