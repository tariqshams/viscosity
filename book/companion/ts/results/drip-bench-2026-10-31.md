# Drip: tree-walker vs bytecode VM (v22.23.4, V8 12.4.254.21-node.57)

Intel(R) Xeon(R) Processor @ 2.10GHz, 2026-10-31T18:28:28.987Z. Best of N, each in a fresh process. Includes compile time. Shared cloud VM.

| program | tree-walker (ms) | VM (ms) | VM speed-up |
|---|---:|---:|---:|
| binary_trees | 19018 | 13078 | 1.45× |
| equality | 15533 | 16501 | 0.94× |
| fib | 23695 | 5685 | 4.17× |
| instantiation | 2742 | 3570 | 0.77× |
| invocation | 2962 | 2042 | 1.45× |
| method_call | 4106 | 1085 | 3.78× |
| properties | 11853 | 2781 | 4.26× |
| string_equality | 13874 | — | VM: [line 32] Error at 'a4': Too many constants in one chunk. |
| trees | 53136 | 21327 | 2.49× |
| zoo | 8358 | 1749 | 4.78× |
| zoo_batch | 10027 | 10011 | 1× |
