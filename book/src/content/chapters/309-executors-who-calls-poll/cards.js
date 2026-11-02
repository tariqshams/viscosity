// Chapter 279 cards: recall prompts, examples, exercises and quiz.
// Keys are stable ids: renaming one would orphan readers' review history.

export const prompts = {
  'exec-what': {
    q: 'What does an **executor** do?',
    a: 'It polls futures to completion, and between polls it waits until a future’s waker is called.',
  },
  'spin-cost': {
    q: 'What is wrong with an executor that polls again at once whenever a future is `Pending`?',
    a: 'It spins: one CPU core runs flat out asking a question whose answer has not changed (58 million polls for one 100 ms wait, here).',
  },
  'park-unpark': {
    q: 'In the chapter’s `block_on`, what do `thread::park` and `unpark` do?',
    a: '`park` puts the executor’s thread to sleep after a Pending; the waker calls `unpark` on that thread, which wakes it to poll again.',
  },
  'early-wake': {
    q: 'What happens if the waker calls `unpark` before `block_on` has reached `thread::park()`?',
    a: 'Nothing is lost: the unpark is remembered, so the next `park` returns at once and the future is polled again.',
  },
  'pin-why': {
    q: 'Why must a future be pinned before it is polled?',
    a: 'An async fn’s future may hold references into itself (to its own saved locals); moving it would leave them pointing at the old address.',
  },
  'tokio-main': {
    q: 'What does `#[tokio::main]` do to `async fn main`?',
    a: 'It is a macro that builds a Tokio runtime and runs the async main body with the runtime’s `block_on`.',
  },
  'join-vs-seq': {
    q: 'Two futures each wait 200 ms. About how long do `a.await; b.await;` and `tokio::join!(a, b)` take?',
    a: 'About 400 ms one after the other (402 ms here), and about 200 ms joined (201 ms), because join! overlaps the waits.',
  },
  'no-block': {
    q: 'Why is `std::thread::sleep` inside an async fn a mistake?',
    a: 'It blocks the whole thread, so the executor cannot poll any other future meanwhile; use the runtime’s async sleep and `.await` it.',
  },
};

export const examples = {
  'park-trace': {
    lang: 'rust',
    title: 'block_on, a timer and a wake, traced',
    code: `use std::future::Future;
use std::pin::{pin, Pin};
use std::sync::atomic::AtomicBool;
use std::sync::atomic::Ordering::SeqCst;
use std::sync::Arc;
use std::task::{Context, Poll};
use std::task::{Wake, Waker};
use std::thread::{self, Thread};
use std::time::Duration;

const WAIT: Duration =
    Duration::from_millis(100);

struct ThreadWaker(Thread);
impl Wake for ThreadWaker {
    fn wake(self: Arc<Self>) {
        println!("waker: unpark");
        self.0.unpark();
    }
}

fn block_on<F: Future>(f: F)
    -> F::Output {
    let mut f = pin!(f);
    let me = thread::current();
    let waker = Waker::from(
        Arc::new(ThreadWaker(me)));
    let mut cx =
        Context::from_waker(&waker);
    loop {
        match f.as_mut().poll(&mut cx) {
            Poll::Ready(v) => return v,
            Poll::Pending => {
                println!("park");
                thread::park();
            }
        }
    }
}

// Ready 100 ms after its first poll.
struct Later {
    flag: Arc<AtomicBool>,
    started: bool,
}

impl Future for Later {
    type Output = ();
    fn poll(
        mut self: Pin<&mut Self>,
        cx: &mut Context<'_>,
    ) -> Poll<()> {
        if self.flag.load(SeqCst) {
            println!("poll: ready");
            return Poll::Ready(());
        }
        if !self.started {
            self.started = true;
            let f = self.flag.clone();
            let w = cx.waker().clone();
            thread::spawn(move || {
                thread::sleep(WAIT);
                f.store(true, SeqCst);
                println!("timer: wake");
                w.wake();
            });
        }
        println!("poll: pending");
        Poll::Pending
    }
}

fn main() {
    let flag = AtomicBool::new(false);
    let later = Later {
        flag: Arc::new(flag),
        started: false,
    };
    block_on(async {
        println!("task: start");
        later.await;
        println!("task: end");
    });
}`,
  },
};

export const exercises = {
  'run-all': {
    lang: 'rust',
    title: 'An executor for many tasks',
    prompt: 'The chapter’s `block_on` runs one future. Write `run_all(tasks)`, which runs a whole list of tasks (boxed, pinned futures) on the current thread, taking turns: each round, poll every unfinished task once, in order, and drop the ones that answer `Ready`; when tasks remain, `thread::park()` until a waker unparks you, then start the next round. Use the `ThreadWaker` given. The tests check the turn order with tasks that pause once between steps, and run three 100 ms timers that must overlap without spinning.',
    starter: `use std::future::Future;
use std::pin::Pin;
use std::sync::Arc;
use std::task::{Context, Poll};
use std::task::{Wake, Waker};
use std::thread::{self, Thread};

struct ThreadWaker(Thread);

impl Wake for ThreadWaker {
    fn wake(self: Arc<Self>) {
        self.0.unpark();
    }
}

type Task =
    Pin<Box<dyn Future<Output = ()>>>;

fn run_all(tasks: Vec<Task>) {
    todo!()
}`,
    solution: `use std::future::Future;
use std::pin::Pin;
use std::sync::Arc;
use std::task::{Context, Poll};
use std::task::{Wake, Waker};
use std::thread::{self, Thread};

struct ThreadWaker(Thread);

impl Wake for ThreadWaker {
    fn wake(self: Arc<Self>) {
        self.0.unpark();
    }
}

type Task =
    Pin<Box<dyn Future<Output = ()>>>;

fn run_all(mut tasks: Vec<Task>) {
    let me = thread::current();
    let waker = Waker::from(
        Arc::new(ThreadWaker(me)));
    let mut cx =
        Context::from_waker(&waker);
    while !tasks.is_empty() {
        tasks.retain_mut(|t| {
            t.as_mut()
                .poll(&mut cx)
                .is_pending()
        });
        if !tasks.is_empty() {
            thread::park();
        }
    }
}`,
    tests: `use std::future::Future;
use std::pin::Pin;
use std::sync::{Arc, Mutex};
use std::task::{Context, Poll, Waker};
use std::thread;
use std::time::{Duration, Instant};

// Pending once (with a wake), then Ready: lets other tasks run.
struct YieldNow(bool);
impl Future for YieldNow {
    type Output = ();
    fn poll(mut self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<()> {
        if self.0 {
            return Poll::Ready(());
        }
        self.0 = true;
        cx.waker().wake_by_ref();
        Poll::Pending
    }
}

// Ready ms milliseconds after its first poll, woken by a helper
// thread; counts its polls.
struct Timer {
    ms: u64,
    shared: Arc<Mutex<(bool, Option<Waker>)>>,
    started: bool,
    polls: Arc<Mutex<u32>>,
}
impl Future for Timer {
    type Output = ();
    fn poll(mut self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<()> {
        *self.polls.lock().unwrap() += 1;
        let mut s = self.shared.lock().unwrap();
        if s.0 {
            return Poll::Ready(());
        }
        s.1 = Some(cx.waker().clone());
        drop(s);
        if !self.started {
            self.started = true;
            let (sh, ms) = (self.shared.clone(), self.ms);
            thread::spawn(move || {
                thread::sleep(Duration::from_millis(ms));
                let mut s = sh.lock().unwrap();
                s.0 = true;
                if let Some(w) = s.1.take() {
                    w.wake();
                }
            });
        }
        Poll::Pending
    }
}

type Log = Arc<Mutex<Vec<String>>>;

fn steps(log: &Log, name: &str, n: usize) -> Task {
    let (log, name) = (log.clone(), name.to_string());
    Box::pin(async move {
        for i in 1..=n {
            log.lock().unwrap().push(format!("{name}{i}"));
            YieldNow(false).await;
        }
    })
}

#[test]
fn no_tasks_returns_at_once() {
    run_all(vec![]);
}

#[test]
fn one_task_runs_to_the_end() {
    let log: Log = Default::default();
    run_all(vec![steps(&log, "a", 3)]);
    assert_eq!(*log.lock().unwrap(), ["a1", "a2", "a3"]);
}

#[test]
fn tasks_take_turns() {
    let log: Log = Default::default();
    run_all(vec![steps(&log, "a", 2), steps(&log, "b", 2)]);
    assert_eq!(*log.lock().unwrap(), ["a1", "b1", "a2", "b2"]);
}

#[test]
fn a_short_task_finishes_first() {
    let log: Log = Default::default();
    run_all(vec![
        steps(&log, "a", 3),
        steps(&log, "b", 1),
        steps(&log, "c", 2),
    ]);
    assert_eq!(*log.lock().unwrap(),
        ["a1", "b1", "c1", "a2", "c2", "a3"]);
}

#[test]
fn waits_overlap_and_nothing_spins() {
    let polls = Arc::new(Mutex::new(0));
    let mk = |ms| -> Task {
        Box::pin(Timer {
            ms,
            shared: Arc::new(Mutex::new((false, None))),
            started: false,
            polls: polls.clone(),
        })
    };
    let start = Instant::now();
    run_all(vec![mk(100), mk(100), mk(100)]);
    let took = start.elapsed();
    assert!(took < Duration::from_millis(250),
        "three 100 ms waits took {took:?}: they should overlap");
    let n = *polls.lock().unwrap();
    assert!(n <= 15, "{n} polls for three timers: park, do not spin");
}
`,
    hints: [
      'Start from the chapter’s `block_on`: the waker and the `Context` are made exactly the same way, once, before any polling. What changes is the loop.',
      'One round is “poll each task once and keep only the ones still Pending”. `Vec::retain_mut` does exactly that: it calls your closure with `&mut` to each element and keeps it when the closure returns `true`. `Poll` has an `is_pending()` method.',
      'The loop is `while !tasks.is_empty() { tasks.retain_mut(|t| t.as_mut().poll(&mut cx).is_pending()); if !tasks.is_empty() { thread::park(); } }`. Every task shares the one waker, so any wake unparks this thread and the next round polls them all.',
    ],
    walkthrough: `**How to think about it.** An executor for many tasks is the one-task executor with a list instead of a single future. Each task is a \`Pin<Box<dyn Future<Output = ()>>>\`: boxed so that tasks of different types fit in one \`Vec\`, and pinned (on the heap) so they can be polled. The chapter’s \`block_on\` polled, and parked on Pending. Here, “poll” becomes “poll everybody once”, finished tasks leave the list, and we park only when tasks remain. Taking turns falls out of the order of the list: a task that pauses lets the next one run, which is exactly what the turn-order tests check.

**The solution, line by line.**

- \`fn run_all(mut tasks: Vec<Task>) {\` takes the list by value; \`mut\` lets us remove tasks from it.
- \`let me = thread::current();\`, \`let waker = Waker::from(Arc::new(ThreadWaker(me)));\` and \`let mut cx = Context::from_waker(&waker);\` are the same three lines as in \`block_on\`. One waker serves every task: whichever task is woken, the same thread is unparked. (A real executor gives each task its own waker so that it knows *which* task to poll; polling all of them is simpler and still correct, because a task with nothing to do answers Pending again.)
- \`while !tasks.is_empty() {\` keeps going until every task has finished. With no tasks at all, the loop never runs and \`run_all\` returns at once.
- \`tasks.retain_mut(|t| { ... });\` visits the tasks in order, handing the closure a \`&mut Task\`, and keeps a task only if the closure returns \`true\`.
- \`t.as_mut().poll(&mut cx).is_pending()\` polls one task: \`as_mut()\` turns \`&mut Pin<Box<...>>\` into the \`Pin<&mut ...>\` that \`poll\` wants. If the answer is Pending we return \`true\` (keep it); if Ready, \`false\`, and the finished task is dropped.
- \`if !tasks.is_empty() { thread::park(); }\` sleeps until some task’s waker unparks us. The check matters: after the last task finishes, nobody would ever unpark us. If a task woke itself during the round (as the tests’ \`YieldNow\` does), the unpark token is already waiting and \`park\` returns at once.

Trace the turn-order test with tasks a (3 steps), b (1) and c (2). Round 1 logs a1, b1, c1, and every task pauses once. Round 2: a logs a2 and pauses; b finishes and is dropped; c logs c2 and pauses. Round 3: a logs a3 and pauses; c finishes. Round 4: a finishes. The log is a1 b1 c1 a2 c2 a3, which is what the test expects. For the timers, round 1 starts all three helper threads, so the three waits overlap and the whole call takes about 100 ms, with a handful of polls.

**Common wrong attempts.**

- Running the tasks one after another (\`for t in tasks\`, each with its own poll-and-park loop). Every task still finishes, but there are no turns: the log reads a1 a2 b1 b2, and three 100 ms timers take 300 ms because the second timer is not even started until the first is done.
- Spinning with \`Waker::noop()\` and no park. The turn order is right, but the timer test counts thousands of polls.
- Parking unconditionally at the end of each round. After the final task finishes, nothing will ever unpark the thread, so \`run_all\` never returns.
- Polling \`t.poll(&mut cx)\` directly: a \`Pin<Box<F>>\` is not itself a \`Pin<&mut F>\`, so you need \`t.as_mut()\` first.`,
    wrong: [
      {
        code: `use std::future::Future;
use std::pin::Pin;
use std::sync::Arc;
use std::task::{Context, Poll};
use std::task::{Wake, Waker};
use std::thread::{self, Thread};

struct ThreadWaker(Thread);

impl Wake for ThreadWaker {
    fn wake(self: Arc<Self>) {
        self.0.unpark();
    }
}

type Task =
    Pin<Box<dyn Future<Output = ()>>>;

fn run_all(tasks: Vec<Task>) {
    let me = thread::current();
    let waker = Waker::from(
        Arc::new(ThreadWaker(me)));
    let mut cx =
        Context::from_waker(&waker);
    for mut t in tasks {
        while t.as_mut()
            .poll(&mut cx)
            .is_pending()
        {
            thread::park();
        }
    }
}`,
        why: 'One task after another: no turns (a1 a2 b1 b2), and the three timers take 300 ms instead of overlapping.',
      },
      {
        code: `use std::future::Future;
use std::pin::Pin;
use std::sync::Arc;
use std::task::{Context, Poll};
use std::task::{Wake, Waker};
use std::thread::{self, Thread};

struct ThreadWaker(Thread);

impl Wake for ThreadWaker {
    fn wake(self: Arc<Self>) {
        self.0.unpark();
    }
}

type Task =
    Pin<Box<dyn Future<Output = ()>>>;

fn run_all(mut tasks: Vec<Task>) {
    let w = Waker::noop();
    let mut cx = Context::from_waker(w);
    while !tasks.is_empty() {
        tasks.retain_mut(|t| {
            t.as_mut()
                .poll(&mut cx)
                .is_pending()
        });
    }
}`,
        why: 'Right order, but it spins: the timers are polled thousands of times while they wait.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'A `block_on` polls its future, gets `Pending`, and calls `thread::park()`. What brings it back?',
    options: [
      {
        t: 'A timeout built into `park`',
        why: '`park` has no timeout (that is `park_timeout`); it waits for an unpark, or occasionally returns spuriously.',
      },
      {
        t: 'The future’s waker, whose `wake` calls `unpark` on the parked thread',
        correct: true,
        why: 'The future kept a clone of the waker from its Context and calls it when it can make progress.',
      },
      {
        t: 'The operating system, once the CPU is free',
        why: 'A parked thread is not waiting for the CPU; it is waiting to be unparked.',
      },
    ],
  },
  {
    q: 'Why did the spinning driver poll a 100 ms timer about 58 million times?',
    options: [
      {
        t: 'Because the timer future woke itself 58 million times',
        why: 'It woke only once; the driver ignored wakes and polled again at once after every Pending.',
      },
      {
        t: 'Because it polled again straight after every Pending, as fast as an optimised loop can, until the timer was Ready',
        correct: true,
        why: 'With no park, the loop runs as fast as the CPU allows (5.8 million times in a debug build here, 58 million in release).',
      },
      {
        t: 'Because Rust futures must be polled once per microsecond',
        why: 'There is no such rule; a good executor polls only after a wake.',
      },
    ],
  },
  {
    q: 'What does `Pin` protect against?',
    options: [
      {
        t: 'Two threads polling the same future at once',
        why: 'That is prevented by `&mut` (only one mutable reference), not by Pin.',
      },
      {
        t: 'A future being dropped before it finishes',
        why: 'Dropping an unfinished future is allowed; it cancels it.',
      },
      {
        t: 'A future being moved after polling starts, which would break references it holds into itself',
        correct: true,
        why: 'An async fn’s saved locals can be borrowed by other saved locals, so the future must stay at one address.',
      },
    ],
  },
  {
    q: 'On a single-threaded Tokio runtime, `tokio::join!(nap(200), nap(200))` took 400 ms. What is the most likely cause?',
    options: [
      {
        t: '`join!` runs futures one after the other',
        why: 'With `tokio::time::sleep(...).await` inside, the same join took 201 ms.',
      },
      {
        t: '`nap` used `std::thread::sleep`, which blocks the only thread',
        correct: true,
        why: 'A blocking call stops the executor, so the second nap cannot start until the first returns.',
      },
      {
        t: 'Tokio needs at least two threads to run two futures',
        why: 'One thread runs any number of futures, as long as they await instead of blocking.',
      },
    ],
  },
  {
    q: 'How does `const [a, b] = await Promise.all([f(), g()])` in TypeScript differ from `let (a, b) = tokio::join!(f(), g());` in Rust?',
    options: [
      {
        t: 'In TypeScript, `f()` and `g()` have already started before `Promise.all` runs; in Rust, `join!` is what starts and polls them',
        correct: true,
        why: 'Promises are eager and the event loop is built in; futures are lazy and need an executor.',
      },
      {
        t: 'They are the same: both wait for the slower one',
        why: 'Both do wait for the slower one, but who starts the work, and when, differs.',
      },
      {
        t: 'Rust runs `f` and `g` on two threads; TypeScript on one',
        why: '`join!` runs both on the current task, concurrently but not in parallel.',
      },
    ],
  },
];
