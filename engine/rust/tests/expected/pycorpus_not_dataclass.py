# viscosity: xs=aos
class P:
    def __init__(self, x):
        self.x = x

xs = []
for i in range(100):
    xs.append(P(i))
s = 0
for p in xs:
    s += p.x
print(s)
