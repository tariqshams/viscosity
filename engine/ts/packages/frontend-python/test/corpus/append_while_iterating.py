# viscosity: ps=soa
from dataclasses import dataclass

@dataclass
class P:
    v: float

ps = []
for i in range(100):
    ps.append(P(float(i)))
n = 0
for p in ps:
    n += 1
    if n < 105:
        ps.append(P(-1.0))
    p.v += 1.0
print(n, len(ps), ps[0].v, ps[104].v)
