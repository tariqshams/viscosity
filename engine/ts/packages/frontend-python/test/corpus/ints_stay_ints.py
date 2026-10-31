# viscosity: cs=soa
from dataclasses import dataclass

@dataclass
class Cell:
    count: int
    weight: float

cs = []
for i in range(300):
    cs.append(Cell(i, i / 2))
for i in range(len(cs)):
    cs[i].count += 1
    cs[i].weight *= 2
print(cs[5].count, cs[5].weight, type(cs[5].count).__name__)
