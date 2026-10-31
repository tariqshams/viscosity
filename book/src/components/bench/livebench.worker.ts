// Runs ONE layout's kernel in a fresh worker and reports timings, so JIT
// type feedback from one layout can't slow down another.
type Msg = { layout: 'aos' | 'soa'; kernel: 'update' | 'sum'; n: number };

self.onmessage = (e: MessageEvent<Msg>) => {
  const { layout, kernel, n } = e.data;
  const dt = 0.016;
  let run: () => number;
  if (layout === 'aos') {
    const a: { x: number; y: number; vx: number; vy: number; mass: number; health: number }[] = [];
    for (let i = 0; i < n; i++) a.push({ x: i, y: i * 2, vx: 1.5, vy: -0.5, mass: 1 + (i % 7), health: 100 });
    run = kernel === 'update'
      ? () => { for (let i = 0; i < a.length; i++) { const p = a[i]; p.x += p.vx * dt; p.y += p.vy * dt; } return a[0].x; }
      : () => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i].mass; return s; };
  } else {
    const x = new Float64Array(n), y = new Float64Array(n), vx = new Float64Array(n), vy = new Float64Array(n);
    const mass = new Float64Array(n), health = new Float64Array(n);
    for (let i = 0; i < n; i++) { x[i] = i; y[i] = i * 2; vx[i] = 1.5; vy[i] = -0.5; mass[i] = 1 + (i % 7); health[i] = 100; }
    run = kernel === 'update'
      ? () => { for (let i = 0; i < n; i++) { x[i] += vx[i] * dt; y[i] += vy[i] * dt; } return x[0]; }
      : () => { let s = 0; for (let i = 0; i < n; i++) s += mass[i]; return s; };
  }
  let sink = 0;
  // Warm up so we measure optimized code, then take many samples.
  const warmEnd = performance.now() + 250;
  while (performance.now() < warmEnd) sink += run();
  const samples: number[] = [];
  for (let s = 0; s < 25; s++) {
    const t0 = performance.now();
    let reps = 0;
    do { sink += run(); reps++; } while (performance.now() - t0 < 8);
    samples.push(((performance.now() - t0) * 1e6) / (reps * n));
  }
  samples.sort((a, b) => a - b);
  (self as unknown as Worker).postMessage({ median: samples[Math.floor(samples.length / 2)], sink });
};
