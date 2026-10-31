# viscosity: bs=soa
from dataclasses import dataclass

@dataclass
class Body:
    x: float
    y: float = 0.5
    m: float = 2.0

bs = []
for i in range(200):
    if i % 2:
        bs.append(Body(i * 1.0, y=1.5))
    else:
        bs.append(Body(x=i * 1.0, y=0.0, m=3.0))
tot = 0.0
for b in bs:
    tot += b.x * b.m + b.y
print(tot)
