# Drip: Rust VM vs TypeScript VM vs TypeScript tree-walker

Intel(R) Xeon(R) Processor @ 2.10GHz, 2026-10-31T19:55:24.609Z. rustc 1.97.0 (2d8144b78 2026-07-07); TypeScript on Node v22.23.4.

drip-rs: best of N wall-clock runs, each a fresh process, compile time included. TypeScript numbers are copied from tsResults (measured in-process, best of 1). Same shared cloud VM for both, so expect noise.

| program | TS tree-walker (ms) | TS VM (ms) | drip-rs (ms) | drip-rs vs TS VM | drip-rs vs tree-walker |
|---|---:|---:|---:|---:|---:|
| binary_trees | 19018 | 13078 | 2672 | 4.89× | 7.12× |
| equality | 15533 | 16501 | 4220 | 3.91× | 3.68× |
| fib | 23695 | 5685 | 1460 | 3.89× | 16.23× |
| instantiation | 2742 | 3570 | 628 | 5.68× | 4.37× |
| invocation | 2962 | 2042 | 577 | 3.54× | 5.13× |
| method_call | 4106 | 1085 | 316 | 3.43× | 12.99× |
| properties | 11853 | 2781 | 795 | 3.5× | 14.91× |
| string_equality | 13874 | error (same) | error: [line 32] Error at 'a4': Too many constants in one chunk. | — | — |
| trees | 53136 | 21327 | 4858 | 4.39× | 10.94× |
| zoo | 8358 | 1749 | 528 | 3.31× | 15.83× |
| zoo_batch | 10027 | 10011 | 10004 | 1× | 1× |

zoo_batch runs for a fixed 10 seconds, so its time says little: what differs is how many batches it finishes. drip-rs finished 3060.

Addendum, measured by hand on the same machine the same day (not by
`scripts/bench.sh`): the TypeScript VM finished 844 zoo_batch batches and
the tree-walker 205, so in throughput drip-rs is 3.6× the TS VM and 14.9×
the tree-walker on that program.
