# Compiling many files in parallel (2026-10-31)

`viscosity build a.js b.js ... -o dir/` and `viscosity explain a.js b.js ...`
compile the files on `std::thread::scope` threads (`--jobs N`, default one
per CPU). This measures the speed-up of N threads over one.

## Setup

- **Machine:** a KVM virtual machine, 4 vCPUs (Intel Xeon @ 2.10 GHz, one
  thread per core), 15 GB RAM, Linux 6.18. rustc 1.97.0, release build
  (`cargo build --release -p viscosity-cli`: thin LTO, one codegen unit).
- **Noise:** the machine was shared with other jobs while measuring (load
  average 2 to 3.5 on 4 CPUs throughout), so the spread between runs is
  large and 4 threads rarely had 4 free CPUs. Each figure is the best of 11
  runs (the median is given too); treat differences under about 10% as
  noise.
- **Batch:** every JavaScript corpus program, every JavaScript end-to-end
  benchmark, every Python corpus program and `e2e-py/particles.py` (66
  files), copied 6 times under distinct names: 396 files, 130 KB. A second
  batch copies that 4 times again: 1,584 files.
- **What is timed:** the whole command, process start to exit (wall clock,
  `date +%s%N` around it), for `--jobs 1` to `--jobs 4`. `build` writes one
  output file per input; it was timed writing to the disk (`/tmp`, ext4 on
  a virtio disk) and to tmpfs (`/dev/shm`). `explain` writes to
  `/dev/null`.

The commands (`$FILES` is the batch, sorted):

```sh
viscosity build --jobs $J -o $OUT/ $FILES > /dev/null
viscosity explain --jobs $J $FILES > /dev/null
```

The outputs for `--jobs 1` and `--jobs 4` were checked to be identical
(`diff -r` on the build directories, and the same explain text).

## Results

396 files, best of 11 (median in parentheses), milliseconds:

| command | 1 thread | 2 threads | 3 threads | 4 threads | speed-up, 4 vs 1 |
|---|---:|---:|---:|---:|---:|
| `build`, output on tmpfs | 40.0 (45.2) | 23.4 (25.6) | 16.5 (18.4) | 13.5 (14.9) | **2.95×** |
| `build`, output on disk | 105.3 (109.6) | 95.8 (110.9) | 97.8 (107.8) | 85.1 (98.8) | 1.24× |
| `explain` | 34.6 (36.5) | 23.2 (27.0) | 16.1 (19.3) | 18.1 (20.9) | 1.9× (2.15× at 3) |

1,584 files, output on tmpfs, best of 11 (median):

| command | 1 thread | 2 threads | 3 threads | 4 threads | speed-up, best vs 1 |
|---|---:|---:|---:|---:|---:|
| `build` | 145.3 (159.8) | 81.9 (87.5) | 58.7 (68.9) | 60.9 (73.1) | 2.5× (3 threads) |
| `explain` | 137.2 (196.3) | 89.5 (104.2) | 63.2 (72.5) | 53.9 (67.4) | 2.5× |

## Reading the numbers

- Compiling scales: with the output on tmpfs, 2 threads take 0.58 of the
  time of one, and 4 threads 0.34 (2.95×) for 396 files. It falls short of
  4× because the machine was busy (with a load average near 3 there were
  rarely 4 idle CPUs), and because some of the run is serial: process
  start, reading the arguments, creating the output directory, and printing
  the results in order.
- On the disk, creating 396 files costs about 65 ms whatever the thread
  count (the virtual disk serializes the file creations), so `build` gains
  only 1.24× there. On a laptop's SSD with a page cache the result will be
  closer to the tmpfs row.
- `explain` gains less (about 2×) because it prints every explanation in
  input order from the main thread after the workers finish, and the
  explain text of the batch is as large as its source.
- One file costs about 0.1 ms to compile in this batch (40 ms for 396
  files with one thread, including writing them), so parallelism matters
  only for batches of hundreds of files; for a few files the default is
  as fast as `--jobs 1`.
