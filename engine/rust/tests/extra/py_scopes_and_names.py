# viscosity: scopes, globals, renamed columns and numbered container classes
from dataclasses import dataclass

@dataclass
class R:
    n: float
    append: float
    f1_: float
    _of: int = 7

ps = []
count = 0

def fill(k):
    global count
    for i in range(k):
        ps.append(R(i * 1.0, i * 2.0, i * 3.0))
        count += 1

def local_copy():
    ps = []
    for i in range(100):
        ps.append(R(1.0, 2.0, 3.0, 1))
    s = 0.0
    for r in ps:
        s += r.n + r.append + r.f1_ + r._of
    return s

def another_copy(m):
    ps = []
    for i in range(m):
        ps.append(R(0.5, 0.25, 0.125))
    t = 0.0
    for i in range(len(ps)):
        t += ps[i].n * ps[i]._of
    return t

fill(150)
j = 0
acc = 0.0
while j < 150:
    r = ps[j]
    acc += r.n * r.f1_ - r.append
    j += 2
print(acc, count, local_copy(), another_copy(120), ps[-1].append, ps[3]._of)
