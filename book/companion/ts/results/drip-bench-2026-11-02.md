# Drip: tree-walker vs bytecode VM (v22.23.4, V8 12.4.254.21-node.57)

Intel(R) Xeon(R) Processor @ 2.10GHz, 2026-11-02T07:39:29.562Z. Best of N, each in a fresh process. Includes compile time. Shared cloud VM.

| program | tree-walker (ms) | VM (ms) | VM speed-up |
|---|---:|---:|---:|
| closures | 811 | 655 | 1.24× |
| fib | 2365 | 1906 | 1.24× |
| fields | 530 | 712 | 0.74× |
| instantiation | 428 | 623 | 0.69× |
| method_calls | 918 | 704 | 1.3× |
| particles | 446 | 380 | 1.17× |
| sieve | 1317 | 1216 | 1.08× |
| sort | 1394 | 1224 | 1.14× |
| strings | 365 | 383 | 0.95× |
| trees | 597 | 749 | 0.8× |
