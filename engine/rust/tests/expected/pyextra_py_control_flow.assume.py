# viscosity: loops with break and continue, early returns, closures
from dataclasses import dataclass

@dataclass
class C:
    v: float
    hits: int = 0

cs = []
for i in range(400):
    cs.append(C(i * 0.25))

def scan(limit):
    found = 0
    i = 0
    while True:
        if i >= len(cs):
            break
        c = cs[i]
        i += 1
        if c.v < 1.0:
            continue
        elif c.v > limit:
            return found
        c.hits += 1
        found += 1
    return found

def make_adder(d):
    def add():
        for c in cs:
            c.v += d
    return add

add = make_adder(0.5)
add()
print(scan(50.0), cs[10].hits, cs[2].hits, cs[399].v)
