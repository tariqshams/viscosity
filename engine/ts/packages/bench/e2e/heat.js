// Heat diffusion on a 512x512 grid of cells {h, next, k, solid}.
const W = 512;
const cells = [];
for (let i = 0; i < W * W; i++) {
  cells.push({ h: (i % 97) / 97, next: 0, k: 0.2, solid: i % 13 === 0 ? 1 : 0 });
}
function diffuse(c) {
  for (let y = 1; y < W - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const i = y * W + x;
      const lap = c[i - 1].h + c[i + 1].h + c[i - W].h + c[i + W].h - 4 * c[i].h;
      c[i].next = c[i].h + c[i].k * lap * (1 - c[i].solid);
    }
  }
  for (let i = 0; i < c.length; i++) c[i].h = c[i].next;
}
const t0 = performance.now();
for (let s = 0; s < 40; s++) diffuse(cells);
const ms = performance.now() - t0;
let s = 0;
for (let i = 0; i < cells.length; i++) s += cells[i].h;
console.log(JSON.stringify({ check: s.toFixed(6), ms }));
