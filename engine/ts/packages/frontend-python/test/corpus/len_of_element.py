# viscosity: gs=soa, ss=aos
# len() of an element is not a read of its field named length.
from dataclasses import dataclass

@dataclass
class S:
    length: float

gs = []
ss = []
for i in range(100):
    gs.append(S(i * 1.0))
    ss.append(S(i * 2.0))
t = 0.0
for i in range(len(gs)):
    t += gs[i].length
for s in ss:
    t += s.length
print(t, len(gs))
print(len(ss[0]))
