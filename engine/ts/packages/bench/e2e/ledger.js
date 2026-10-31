// A ledger of 500k transactions; queries sum one or two fields.
const N = 500000;
const tx = [];
for (let i = 0; i < N; i++) {
  tx.push({ amount: (i % 1000) / 10, fee: (i % 7) / 100, account: i % 997, day: i % 365, flags: i % 4, tax: 0.2 });
}
function total(t) {
  let s = 0;
  for (let i = 0; i < t.length; i++) s += t[i].amount;
  return s;
}
function feesOn(t, day) {
  let s = 0;
  for (let i = 0; i < t.length; i++) if (t[i].day === day) s += t[i].fee;
  return s;
}
const t0 = performance.now();
let acc = 0;
for (let r = 0; r < 40; r++) acc += total(tx) + feesOn(tx, r);
const ms = performance.now() - t0;
console.log(JSON.stringify({ check: acc.toFixed(4), ms }));
