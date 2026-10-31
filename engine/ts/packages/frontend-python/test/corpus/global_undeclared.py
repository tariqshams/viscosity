# viscosity: ps=soa
# `global scale` creates a module variable that the module never assigns itself.
from dataclasses import dataclass

@dataclass
class P:
    x: float

def setup():
    global scale
    scale = 2.0

setup()
ps = []
for i in range(100):
    ps.append(P(i * scale))
for p in ps:
    p.x += 1.0
print(ps[3].x, scale)
