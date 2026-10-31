# viscosity: tabs, a backslash continuation, semicolons, adjacent strings
from dataclasses import dataclass
import math

@dataclass
class Q:
	a: float
	b: float = +2.0
	label: str = "q" "x"

qs = [Q(1.0, 2.0), Q(a=3.0)]
for i in range(1, 300):
	qs.append(Q(float(i), \
		b=i / 4))
	if i % 7 == 0 and not (i % 2 == 0 or i > 250): qs[i].a = -qs[i].a; qs[i].b += 1
t = 0.0
for q in qs:
	t += q.a if q.a > 0 else math.fabs(q.a) * q.b
	t += 1.0 if q.label is not None else 0.0
print(round(t, 6), len(qs), qs[7].a, qs[1].label, f"{t:.2f}")
