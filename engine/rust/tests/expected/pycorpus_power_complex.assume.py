# viscosity: ps=aos
# float ** float can be complex, so x is not provably a float.
from dataclasses import dataclass

@dataclass
class P:
    x: float

ps = []
for i in range(100):
    ps.append(P(-1.0 * i))
for p in ps:
    p.x = p.x ** 0.5
print(ps[4].x)
