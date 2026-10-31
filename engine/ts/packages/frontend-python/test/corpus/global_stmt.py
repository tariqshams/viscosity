# viscosity: ps=soa
from dataclasses import dataclass

@dataclass
class P:
    x: float
    y: float

ps = []
total = 0.0

def fill(n):
    for i in range(n):
        ps.append(P(i * 1.0, 2.0))

def accumulate():
    global total
    for p in ps:
        total += p.x * p.y

fill(500)
accumulate()
print(total, len(ps))
