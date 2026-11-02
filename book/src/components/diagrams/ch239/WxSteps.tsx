// The life of one page of JIT memory under W^X, as in the chapter's C
// program: mmap (read+write), memcpy the bytes of `addi a0, a0, 1; ret`
// (13 05 15 00 67 80 00 00, checked with llvm-mc 18), mprotect to
// read+execute, flush the instruction cache, call it, and what happens
// when something tries to write to it afterwards (mprotect(2): SIGSEGV).
import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

type S = {
  r: boolean; w: boolean; x: boolean;
  bytes: boolean; call?: string; bad?: boolean;
  label: string; note: string;
};

const BYTES = ['13', '05', '15', '00', '67', '80', '00', '00'];

const STATES: S[] = [
  { r: true, w: true, x: false, bytes: false, label: 'mmap(..., PROT_READ | PROT_WRITE, ...)', note: 'The JIT asks the operating system for a fresh page of memory (4096 bytes). It asks for read and write permission only: the page may be filled, but nothing in it may run yet.' },
  { r: true, w: true, x: false, bytes: true, label: 'memcpy(p, code, 8)', note: 'It writes its machine code into the page: eight bytes, which are addi a0, a0, 1 followed by ret. To the memory system these are ordinary data stores, like writing into an array.' },
  { r: true, w: false, x: true, bytes: true, label: 'mprotect(p, 4096, PROT_READ | PROT_EXEC)', note: 'Now it flips the page: write permission off, execute permission on. At no moment was the page both writable and executable; that rule is called W^X, "write xor execute".' },
  { r: true, w: false, x: true, bytes: true, label: '__builtin___clear_cache(p, p + 8)', note: 'The processor may fetch instructions through a separate instruction cache that has not seen the stores. On RISC-V, fence.i (from the Zifencei extension) is the standard way to make them visible; on Linux this call asks the kernel to do it.' },
  { r: true, w: false, x: true, bytes: true, call: 'f(41) = 42', label: 'f = (fn)p; f(41)', note: 'The address of the page is used as a function pointer and called like any compiled function: the argument 41 arrives in a0, addi adds 1, ret jumps back through ra. The result is 42.' },
  { r: true, w: false, x: true, bytes: true, bad: true, label: 'p[0] = 0x6f;   /* a later write */', note: 'If anything (a bug, or an attacker who found a way to write memory) now tries to change those bytes, the store is refused and the kernel sends SIGSEGV. A JIT that wants to patch its code must flip the page back to writable first, and lose execute while it does.' },
];

function Perm({ x, on, label, bad }: { x: number; on: boolean; label: string; bad?: boolean }) {
  return (
    <Box x={x} y={22} w={44} h={26} fill={bad ? tok('danger', 0.25) : on ? tok('safe', 0.25) : tok('paper')} stroke={bad ? tok('danger') : on ? tok('safe') : tok('line')}>
      <T x={x + 22} y={35} size={13} mono anchor="middle" weight={700} fill={on ? tok('ink') : tok('muted', 0.6)}>{on ? label : '-'}</T>
    </Box>
  );
}

export default function WxSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="One page of JIT memory, kept W^X" steps={s} note={st.note}>
      <Svg w={400} h={190} title="A 4096-byte page with read, write and execute permission flags, the eight bytes of machine code written into it, and the call that runs them">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>PERMISSIONS OF THE PAGE</T>
        <Perm x={8} on={st.r} label="R" />
        <Perm x={58} on={st.w} label="W" bad={st.bad} />
        <Perm x={108} on={st.x} label="X" />
        <T x={164} y={35} size={12} fill={st.w && st.x ? tok('danger') : tok('muted')}>{st.w ? 'writable, cannot run' : 'runnable, cannot write'}</T>
        <T x={8} y={66} size={11} weight={700} fill={tok('muted')}>THE PAGE (first 8 of 4096 bytes)</T>
        {BYTES.map((b, k) => (
          <Box key={k} x={8 + k * 46} y={76} w={42} h={28} fill={st.bytes ? tok(k < 4 ? 'f1' : 'f2', 0.2) : tok('paper')} stroke={st.bad && k === 0 ? tok('danger') : st.bytes ? tok(k < 4 ? 'f1' : 'f2') : tok('line')}>
            <T x={29 + k * 46} y={90} size={13} mono anchor="middle" fill={st.bytes ? tok('ink') : tok('muted', 0.5)}>{st.bytes ? b : '00'}</T>
          </Box>
        ))}
        {st.bytes && <T x={8 + 2 * 46} y={116} size={11} mono anchor="middle" fill={tok('muted')}>addi a0, a0, 1</T>}
        {st.bytes && <T x={8 + 6 * 46} y={116} size={11} mono anchor="middle" fill={tok('muted')}>ret</T>}
        <Box x={8} y={132} w={384} h={26} fill={tok('panel')} stroke={tok('line')}>
          <T x={16} y={145} size={11.5} mono>{st.label}</T>
        </Box>
        {st.call && <T x={8} y={176} size={13} mono weight={700} fill={tok('safe')}>{st.call}</T>}
        {st.bad && <T x={8} y={176} size={13} mono weight={700} fill={tok('danger')}>SIGSEGV: the store is refused</T>}
      </Svg>
    </StepFrame>
  );
}
