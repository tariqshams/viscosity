# viscosity: ps=soa
# The file ends in a hex literal with no line break after it.
from dataclasses import dataclass

@dataclass
class P:
    x: float

ps = []
for i in range(100):
    ps.append(P(i * 1.0))
k = 0

def bump():
    for i in range(len(ps)):
        ps[i].x += 1.0
    ps[k].x += 1.0

bump()
print(ps[0].x, ps[1].x)
k = 0x1