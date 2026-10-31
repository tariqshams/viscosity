// viscosity: ps=soa
const ps = [];
for (let i = 0; i < 100; i++)
  ps.push({ x: i });
for (let i = 0; i < ps.length; i++)
  ps[i].x *= 2;
try { ps[100].x += 1; } catch (e) {
  console.log(e.message);
}
try { ps[100].x = 1; } catch (e) {
  console.log(e.message);
}
try { ps[-1].x++; } catch (e) {
  console.log(e.message);
}
