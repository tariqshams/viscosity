import { byId } from '../../data/references.js';

/** Numbered citation, e.g. [2], linking to the chapter's reference list. */
export function makeCite(sources: string[]) {
  return function Cite({ id }: { id: string }) {
    const i = sources.indexOf(id);
    const ref = byId(id);
    if (i < 0 || !ref) throw new Error(`<Cite id="${id}"> is not in this chapter's sources / the bibliography`);
    return (
      <sup className="cite"><a href={`#ref-${id}`} id={`cite-${id}`} aria-label={`Reference ${i + 1}: ${ref.title}`}>[{i + 1}]</a></sup>
    );
  };
}
