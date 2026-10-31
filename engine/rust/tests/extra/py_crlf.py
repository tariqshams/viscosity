# viscosity(no-auto): CRLF line endings
from dataclasses import dataclass

@dataclass
class P:
    x: float
    y: float

# @viscosity soa
ps = []
for i in range(100):
    ps.append(P(i * 0.5, 1.0))
for p in ps:
    p.x += p.y
print(ps[10].x, len(ps))
