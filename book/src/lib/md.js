// A deliberately tiny markdown renderer for prompt cards, quiz text and
// exercise walkthroughs. Supports: paragraphs, ```code fences```, `code`,
// **bold**, *italic*, [links](url) and "- " bullet lists. Everything else is
// escaped, so card text can never inject HTML.

const esc = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function inline(s) {
  const parts = s.split(/(`[^`]+`)/g);
  return parts
    .map((p) => {
      if (p.startsWith('`') && p.endsWith('`') && p.length > 1) return `<code>${esc(p.slice(1, -1))}</code>`;
      return esc(p)
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/\*([^*]+)\*/g, '<em>$1</em>')
        .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+|\/[^)\s]*)\)/g, '<a href="$2">$1</a>');
    })
    .join('');
}

export function md(src) {
  const out = [];
  const lines = String(src).replace(/\r/g, '').split('\n');
  let i = 0;
  let para = [];
  let list = [];
  const flushPara = () => { if (para.length) { out.push(`<p>${inline(para.join(' '))}</p>`); para = []; } };
  const flushList = () => { if (list.length) { out.push(`<ul>${list.map((l) => `<li>${inline(l)}</li>`).join('')}</ul>`); list = []; } };
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim().startsWith('```')) {
      flushPara(); flushList();
      const code = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) code.push(lines[i++]);
      out.push(`<pre><code>${esc(code.join('\n'))}</code></pre>`);
      i++;
      continue;
    }
    if (/^\s*- /.test(line)) { flushPara(); list.push(line.replace(/^\s*- /, '')); i++; continue; }
    if (line.trim() === '') { flushPara(); flushList(); i++; continue; }
    flushList();
    para.push(line.trim());
    i++;
  }
  flushPara(); flushList();
  return out.join('');
}
