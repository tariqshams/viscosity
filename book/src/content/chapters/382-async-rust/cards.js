// Chapter 382 cards. Keys are stable ids: never rename them.
// Every rustc message and size quoted here was produced with rustc
// 1.97.0 on x86-64 Linux while the chapter was written.

const L = (...xs) => xs.join('\n');

export const prompts = {
  'future-what': {
    q: 'What is a Rust **future**?',
    a: 'A value implementing the `Future` trait: work that may not be finished, which makes progress only when its `poll` method is called.',
  },
  'poll-two': {
    q: 'What are the two answers `poll` can give?',
    a: '`Poll::Ready(value)` (done, here is the output) or `Poll::Pending` (not yet).',
  },
  'waker-why': {
    q: 'A future returns `Poll::Pending` but never touches the waker in its `Context`. What happens?',
    a: 'Nothing ever polls it again (in a real executor), so it never finishes. Pending must come with an arranged wake.',
  },
  'pin-read': {
    q: 'In `poll(self: Pin<&mut Self>, ...)`, what does `Pin` add to `&mut Self`?',
    a: 'A promise that the future will not be moved in memory from now on.',
  },
  lazy: {
    q: 'You call an `async fn` in Rust and throw away the result. Does its body run?',
    a: 'No. Futures are lazy: the call only builds the future, and rustc warns “futures do nothing unless you `.await` or poll them”.',
  },
  'await-where': {
    q: 'Why is `.await` allowed only inside async functions and blocks (E0728)?',
    a: 'Because only an async body has somewhere to save its state and answer `Pending` while the awaited future is not ready.',
  },
  'main-async': {
    q: 'Why can a plain Rust program not write `async fn main` (E0752)?',
    a: 'Nothing would poll the future it returns: Rust has no built-in executor, so a program has to start one.',
  },
  'state-enum': {
    q: 'What does the compiler turn an async fn into?',
    a: 'An enum with one variant per place it can pause (holding the variables still needed there), plus a `poll` that matches on it.',
  },
};

export const examples = {
  'lazy-sum': {
    lang: 'rust',
    title: 'Calling an async fn runs nothing',
    code: String.raw`use std::future::Future;
use std::pin::pin;
use std::task::{Context, Poll, Waker};

// The crudest driver: poll in a loop.
fn block_on<F: Future>(f: F)
    -> F::Output {
    let mut f = pin!(f);
    let w = Waker::noop();
    let mut cx = Context::from_waker(w);
    loop {
        if let Poll::Ready(v) =
            f.as_mut().poll(&mut cx)
        {
            return v;
        }
    }
}

async fn double(x: u32) -> u32 {
    println!("  double({x}) runs");
    x * 2
}

async fn sum() -> u32 {
    let a = double(1).await;
    let b = double(20).await;
    a + b
}

fn main() {
    let fut = sum();
    println!("made the future");
    let n = block_on(fut);
    println!("got {n}");
}`,
  },
};

const COUNTDOWN_TESTS = String.raw`use std::future::Future;
use std::pin::Pin;
use std::sync::atomic::AtomicUsize;
use std::sync::atomic::Ordering::SeqCst;
use std::sync::Arc;
use std::task::{Context, Poll, Wake, Waker};

struct Wakes(AtomicUsize);
impl Wake for Wakes {
    fn wake(self: Arc<Self>) {
        self.0.fetch_add(1, SeqCst);
    }
}

// Polls f until Ready, but only polls again after a wake (as a
// real executor would). Returns the output, polls and wakes.
fn run<F: Future>(f: F) -> (F::Output, usize, usize) {
    let w = Arc::new(Wakes(AtomicUsize::new(0)));
    let waker = Waker::from(w.clone());
    let mut cx = Context::from_waker(&waker);
    let mut f = std::pin::pin!(f);
    let mut polls = 0;
    loop {
        polls += 1;
        let p = f.as_mut().poll(&mut cx);
        let wakes = w.0.load(SeqCst);
        if let Poll::Ready(v) = p {
            return (v, polls, wakes);
        }
        assert!(wakes >= polls,
            "Pending without a wake: nobody would poll again");
        assert!(polls < 1000, "still Pending after 1000 polls");
    }
}

#[test]
fn zero_is_ready_at_once() {
    let ((), polls, wakes) = run(Countdown(0));
    assert_eq!((polls, wakes), (1, 0));
}

#[test]
fn three_is_pending_three_times() {
    let ((), polls, wakes) = run(Countdown(3));
    assert_eq!((polls, wakes), (4, 3));
}

#[test]
fn launch_awaits_the_countdown() {
    let (s, polls, _) = run(launch(2));
    assert_eq!(s, "liftoff after 2");
    assert_eq!(polls, 3);
}

#[test]
fn launch_zero_needs_one_poll() {
    let (s, polls, _) = run(launch(0));
    assert_eq!(s, "liftoff after 0");
    assert_eq!(polls, 1);
}`;

const HEAD = String.raw`use std::future::Future;
use std::pin::Pin;
use std::task::{Context, Poll};

struct Countdown(u32);
`;

export const exercises = {
  countdown: {
    lang: 'rust',
    title: 'A countdown future, and an async fn that awaits it',
    prompt:
      'Implement `Future` for `Countdown(n)`: each poll, if `n` is 0 answer `Poll::Ready(())`; otherwise subtract one, wake the task (`cx.waker().wake_by_ref()`) and answer `Poll::Pending`. Then write `async fn launch(n)`, which awaits `Countdown(n)` and returns the text `liftoff after n`. The tests drive your futures with a small executor that only polls again after a wake, and count the polls.',
    starter: HEAD + String.raw`
impl Future for Countdown {
    type Output = ();
    fn poll(
        mut self: Pin<&mut Self>,
        cx: &mut Context<'_>,
    ) -> Poll<()> {
        todo!()
    }
}

async fn launch(n: u32) -> String {
    todo!()
}`,
    solution: HEAD + String.raw`
impl Future for Countdown {
    type Output = ();
    fn poll(
        mut self: Pin<&mut Self>,
        cx: &mut Context<'_>,
    ) -> Poll<()> {
        if self.0 == 0 {
            return Poll::Ready(());
        }
        self.0 -= 1;
        cx.waker().wake_by_ref();
        Poll::Pending
    }
}

async fn launch(n: u32) -> String {
    Countdown(n).await;
    format!("liftoff after {n}")
}`,
    tests: COUNTDOWN_TESTS,
    hints: [
      'Two cases in `poll`: the count is already zero, or it is not. Which one is the answer “done”?',
      'For a non-zero count: change the state first (`self.0 -= 1`), then make sure somebody will poll again, then answer `Pending`. `Countdown` holds only a `u32`, so you may change `self.0` through the `Pin` as if it were `&mut self`.',
      'The wake is `cx.waker().wake_by_ref();`. In `launch`, the first line is `Countdown(n).await;` and the second builds the text with `format!("liftoff after {n}")`.',
    ],
    walkthrough: L(
      '**How to think about it.** A hand-written future is a little machine that is asked the same question over and over: “are you done yet?” Its whole memory is the number inside `Countdown`. So decide, for each possible number, what the answer is and what the number should become. Zero means done. Anything else means “not yet”, and before saying so it must do two things: move one step closer to done (or it would say “not yet” forever), and make sure it is asked again (or nobody would ever ask). The tests check both: their executor polls again only after a wake, and gives up after 1000 polls.',
      '',
      '**The solution, line by line.**',
      '',
      '- `impl Future for Countdown {` promises that `Countdown` has a `poll` method and an `Output` type.',
      '- `type Output = ();` says the answer carries no information: the unit value `()`, Rust’s “nothing interesting”. The waiting itself is the point.',
      '- `fn poll(mut self: Pin<&mut Self>, cx: &mut Context<\'_>) -> Poll<()> {` is the trait’s signature with `mut` added before `self`, so we may change the count. `Pin` would normally stop us getting a plain `&mut` to the inside; because a `u32` does not care whether it is moved (the type is `Unpin`), `Pin` lets us through, and `self.0` works as usual.',
      '- `if self.0 == 0 { return Poll::Ready(()); }` handles the finished case first: answer `Ready`, carrying `()`.',
      '- `self.0 -= 1;` takes one step towards zero, so `Countdown(3)` answers Pending exactly three times.',
      '- `cx.waker().wake_by_ref();` tells whoever is polling “poll me again”. A real future would save a clone of the waker and call it later, when its data arrived; ours can always make progress, so it asks at once. `wake_by_ref` borrows the waker rather than using it up.',
      '- `Poll::Pending` is the answer for this poll.',
      '- `async fn launch(n: u32) -> String {` declares a function that returns a future of a `String`; none of its body runs when it is called.',
      '- `Countdown(n).await;` polls the countdown. Each time the countdown answers Pending, the whole `launch` future answers Pending and keeps its place here; when it answers Ready, execution carries on.',
      '- `format!("liftoff after {n}")` builds the text, and as the last expression it is the future’s output. `n` is still available because the future saved it.',
      '',
      'So `launch(2)` is polled three times: Pending, Pending, then Ready with the text, which is what the third test checks.',
      '',
      '**Common wrong attempts.**',
      '',
      '- Leaving out the wake. On paper the logic is right, and an executor that polls in a loop (like the chapter’s `block_on`) would even finish; a real executor would poll once, see Pending and wait forever for a wake that never comes. The tests’ executor catches this with “Pending without a wake: nobody would poll again”.',
      '- Forgetting `self.0 -= 1`. The future wakes itself and answers Pending forever, so the tests stop after 1000 polls.',
      '- Writing `Countdown(n);` without `.await` in `launch`. That builds the future and drops it (rustc warns that futures do nothing unless awaited), so `launch` finishes on its first poll and the poll count is wrong.',
      '- Returning `Poll::Ready` from `launch` by hand. Inside an async fn you never write `Poll`: you return the plain value and the compiler wraps it.',
    ),
    wrong: [
      {
        code: HEAD + String.raw`
impl Future for Countdown {
    type Output = ();
    fn poll(
        mut self: Pin<&mut Self>,
        cx: &mut Context<'_>,
    ) -> Poll<()> {
        if self.0 == 0 {
            return Poll::Ready(());
        }
        self.0 -= 1;
        Poll::Pending
    }
}

async fn launch(n: u32) -> String {
    Countdown(n).await;
    format!("liftoff after {n}")
}`,
        why: 'No wake: after the first Pending, a real executor would never poll again. The tests report “Pending without a wake”.',
      },
      {
        code: HEAD + String.raw`
impl Future for Countdown {
    type Output = ();
    fn poll(
        mut self: Pin<&mut Self>,
        cx: &mut Context<'_>,
    ) -> Poll<()> {
        if self.0 == 0 {
            return Poll::Ready(());
        }
        self.0 -= 1;
        cx.waker().wake_by_ref();
        Poll::Pending
    }
}

async fn launch(n: u32) -> String {
    Countdown(n);
    format!("liftoff after {n}")
}`,
        why: 'Without `.await` the countdown is built and dropped, so `launch(2)` is ready on its first poll instead of its third.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'What does this print? `async fn hi() { println!("hi"); }` and then, in a plain `main`, `hi(); println!("done");`',
    options: [
      { t: '`hi` then `done`', why: 'That is what the TypeScript version prints. In Rust the call only builds a future, which is never polled.' },
      { t: '`done` only (with a compiler warning)', correct: true, why: 'Futures are lazy; rustc warns that the unused future does nothing unless awaited or polled.' },
      { t: 'A compile error', why: 'Calling an async fn from ordinary code is fine; it is `.await` that needs an async context.' },
    ],
  },
  {
    q: 'A future’s `poll` returns `Poll::Pending`. What else must it have done?',
    options: [
      { t: 'Arranged for the waker from its `Context` to be called when it can make progress', correct: true, why: 'Otherwise no executor will ever poll it again.' },
      { t: 'Spawned a thread', why: 'Some futures do, but most wait on the operating system or a timer; the requirement is the wake, not a thread.' },
      { t: 'Nothing: the executor keeps polling every future in a loop', why: 'Good executors poll only after a wake; polling in a tight loop wastes a whole CPU.' },
      { t: 'Returned its partial result', why: '`Pending` carries no value at all.' },
    ],
  },
  {
    q: 'Which line gets error E0728?',
    options: [
      { t: '`async fn f() -> u32 { ready(1).await }`', why: 'Inside an async fn, `.await` is allowed.' },
      { t: '`let f = async { ready(1).await };`', why: 'An async block is an async context too.' },
      { t: '`fn f() -> u32 { ready(1).await }`', correct: true, why: '“`await` is only allowed inside `async` functions and blocks”: a plain fn has nowhere to save its state.' },
    ],
  },
  {
    q: 'Why does `size_of_val(&big())` come out as 1012 bytes for an async fn that keeps a 1000-byte array across an `.await`?',
    options: [
      { t: 'Futures are boxed on the heap with a header', why: 'There is no hidden heap allocation; the future is a plain value.' },
      { t: 'The array is a variable that lives across a pause, so it is stored inside the future’s state enum', correct: true, why: 'Every variable needed after an `.await` is saved in the variant for that pause, so the future is as big as its biggest pause.' },
      { t: 'The size counts the stack of the thread that polls it', why: 'Async functions have no stack of their own between polls; the state lives in the future.' },
    ],
  },
  {
    q: 'In `async fn four() -> u32 { let a = two().await; a + two().await }`, what is the type of `four()`?',
    options: [
      { t: '`u32`', why: 'That is the type of the value the future eventually produces, not of the call.' },
      { t: '`Poll<u32>`', why: '`Poll` is what `poll` returns, once per poll.' },
      { t: 'Some type implementing `Future<Output = u32>`', correct: true, why: 'An async fn returns a future of its declared return type; its exact type is generated by the compiler.' },
    ],
  },
];
