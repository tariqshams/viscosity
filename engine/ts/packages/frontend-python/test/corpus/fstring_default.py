# viscosity: ps=aos
# An f-string default reads K once, when the class is defined, not at each call.
from dataclasses import dataclass

K = 1.0

@dataclass
class P:
    x: float
    tag: str = f"k={K}"

K = 2.0
ps = []
for i in range(100):
    ps.append(P(i * 1.0))
for p in ps:
    p.x += 1.0
print(ps[0].tag, ps[5].x)
