# viscosity(no-auto): annotations decide, as with the CLI's default options
"""Module docstring: the generated prelude goes after it.

It spans lines and mentions ''' quotes.
"""
from __future__ import annotations
from dataclasses import dataclass
import math

@dataclass
class V:
    x: float
    y: float
    w: float = -1.5

# @viscosity soa
vs = []
# @viscosity aos
keep = []
others = []  # not annotated: CPython's default keeps objects

for i in range(200):
    vs.append(V(i * 1.0, math.sqrt(i)))
    keep.append(V(1.0, 2.0, w=3.0))
    others.append(V(0.5, 0.25))

def norm_vs():
    total = 0.0
    for v in vs:
        total += math.hypot(v.x, v.y) * v.w
    return total

def norm_keep():
    total = 0.0
    for v in keep:
        total += v.x * v.w
    return total

print(round(norm_vs(), 6), round(norm_keep(), 6), len(others))
for k in range(len(vs)):
    if k % 3 == 0:
        vs[k].x -= 1.0
    elif k % 3 == 1:
        vs[k].y *= 2.0
    else:
        continue
print(vs[0].x, vs[1].y, vs[2].x, others[0].y)
