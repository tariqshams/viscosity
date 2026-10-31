# viscosity: ps=aos
# P is rebound, so P(...) does not construct the dataclass.
from dataclasses import dataclass

@dataclass
class P:
    x: float

class Twice:
    def __init__(self, x):
        self.x = 2 * x

P = Twice
ps = []
for i in range(100):
    ps.append(P(i * 1.0))
for p in ps:
    p.x += 1.0
print(ps[3].x)
