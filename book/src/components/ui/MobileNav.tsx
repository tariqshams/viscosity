import { useEffect } from 'react';

/** The reference's mobile menu button. It opens the sidebar (#book-nav) as a drawer, so
 *  the navigation is in the page once, not duplicated in a React prop. */
export function MobileNav() {
  useEffect(() => {
    const close = () => document.documentElement.removeAttribute('data-nav');
    const onClick = (e: MouseEvent) => { if ((e.target as HTMLElement).closest('[data-nav-close]')) close(); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('click', onClick); document.removeEventListener('keydown', onKey); };
  }, []);
  return (
    <button onClick={() => document.documentElement.setAttribute('data-nav', 'open')} aria-label="Open navigation"
      className="btn-3d btn-3d-sm grid h-9 w-9 shrink-0 place-items-center lg:hidden">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
    </button>
  );
}
