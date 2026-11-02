# Drip: Rust VM vs TypeScript VM vs TypeScript tree-walker

Intel(R) Xeon(R) Processor @ 2.10GHz, 2026-11-02T07:39:43.783Z. rustc 1.97.0 (2d8144b78 2026-07-07); TypeScript on Node v22.23.4.

drip-rs: best of N wall-clock runs, each a fresh process, compile time included. TypeScript numbers are copied from tsResults (each a fresh process, best of 3). Same shared cloud VM for both, so expect noise.

| program | TS tree-walker (ms) | TS VM (ms) | drip-rs (ms) | drip-rs vs TS VM | drip-rs vs tree-walker |
|---|---:|---:|---:|---:|---:|
| closures | 811 | 655 | 139 | 4.71× | 5.83× |
| fib | 2365 | 1906 | 406 | 4.69× | 5.83× |
| fields | 530 | 712 | 193 | 3.69× | 2.75× |
| instantiation | 428 | 623 | 140 | 4.45× | 3.06× |
| method_calls | 918 | 704 | 167 | 4.22× | 5.5× |
| particles | 446 | 380 | 83 | 4.58× | 5.37× |
| sieve | 1317 | 1216 | 283 | 4.3× | 4.65× |
| sort | 1394 | 1224 | 248 | 4.94× | 5.62× |
| strings | 365 | 383 | 305 | 1.26× | 1.2× |
| trees | 597 | 749 | 156 | 4.8× | 3.83× |
