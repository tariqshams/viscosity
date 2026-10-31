import { useEffect, useState } from 'react';
import { loadProgress, saveProgress } from '../../lib/progress';

/** "Mark chapter as done" at the end of a chapter; also remembers where you are. */
export default function ChapterDone({ n, slug }: { n: number; slug: string }) {
  const [done, setDone] = useState(false);
  useEffect(() => {
    const p = loadProgress();
    setDone(!!p.done[n]);
    if (p.last !== slug) { p.last = slug; saveProgress(p); }
  }, [n, slug]);
  const toggle = () => {
    const p = loadProgress();
    if (p.done[n]) delete p.done[n]; else p.done[n] = new Date().toISOString();
    saveProgress(p);
    setDone(!!p.done[n]);
  };
  return (
    <button type="button" onClick={toggle} className={`btn-3d px-4 py-2 font-sans text-sm font-semibold ${done ? '' : 'btn-3d-primary'}`} aria-pressed={done} data-chapter-done>
      {done ? '✓ Chapter done' : 'Mark chapter as done'}
    </button>
  );
}
