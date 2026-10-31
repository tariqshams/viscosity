import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => { setDark(document.documentElement.classList.contains('dark')); }, []);
  function toggle() {
    const el = document.documentElement;
    const next = !el.classList.contains('dark');
    el.classList.toggle('dark', next);
    try { localStorage.setItem('theme', next ? 'dark' : 'light'); } catch {}
    setDark(next);
  }
  return (
    <button onClick={toggle} aria-label="Toggle dark mode"
      className="btn-3d btn-3d-sm px-3 py-1 text-sm">
      {dark ? 'Light' : 'Dark'}
    </button>
  );
}
