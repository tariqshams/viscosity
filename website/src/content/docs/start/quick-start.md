---
title: Quick start
description: Compile your first file and read the explanation.
---

Save this as `particles.js`:

```js
const ps = [];
for (let i = 0; i < 100000; i++) {
  ps.push({ x: i, y: 0, vx: 1, vy: -1, mass: 2 });
}
function step(arr, dt) {
  for (let i = 0; i < arr.length; i++) {
    const p = arr[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
  }
}
for (let f = 0; f < 100; f++) step(ps, 0.016);
console.log(ps[0].x);
```

Ask Viscosity what it would do:

```sh
viscosity explain particles.js
```

```text
ps (line 1) {x, y, vx, vy, mass} → struct of arrays
  · loop at line 6 in step() touches 4 of 5 fields (x, vx, y, vy)
  · typed Float64Array columns for all 5 fields
  · about 100000 elements
  · 1 of 2 element accesses proven in bounds
```

Then build it:

```sh
viscosity build particles.js -o particles.vsc.js
node particles.vsc.js   # same output, faster loop
```

The `ps[0].x` at the end isn't inside a loop that proves it is in bounds,
so Viscosity wraps it in a check that throws exactly the `TypeError` the
original would have thrown for a bad index. Use `--bounds assume` to drop
those checks if you trust your indexes.
