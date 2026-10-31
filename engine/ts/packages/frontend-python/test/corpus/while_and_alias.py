# viscosity: gs=soa
import math
from dataclasses import dataclass

@dataclass
class G:
    a: float
    b: float

gs = [G(1.0, 2.0), G(3.0, 4.0)]
i = 0
while i < 400:
    gs.append(G(math.sin(i), math.cos(i)))
    i += 1
j = 0
acc = 0.0
while j < len(gs):
    g = gs[j]
    acc += g.a * g.a + g.b * g.b
    j += 1
print(round(acc, 9), len(gs))
