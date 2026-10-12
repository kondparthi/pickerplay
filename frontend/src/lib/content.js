// Turns legacy / pasted plain text into clean HTML paragraphs, headings and lists.
// HTML that already has block tags is returned unchanged.
const BLOCK_RE = /<(p|h[1-6]|ul|ol|li|div|table|blockquote|figure|img|iframe|pre|section|article)\b/i
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const BULLET_RE = /^\s*(?:[-–—•*]|\d+[.)])\s+/

export function normalizeHtml(content) {
  const text = (content || '').trim()
  if (!text || BLOCK_RE.test(text)) return text
  const out = []
  const lines = text.replace(/\r\n?/g, '\n').split('\n')
  let list = null
  const flush = () => {
    if (list) out.push(`<${list.tag}>${list.items.map((i) => `<li>${i}</li>`).join('')}</${list.tag}>`)
    list = null
  }
  lines.forEach((raw, idx) => {
    const line = raw.trim()
    if (!line) { flush(); return }
    if (BULLET_RE.test(line)) {
      const tag = /^\s*\d+[.)]/.test(line) ? 'ol' : 'ul'
      if (!list || list.tag !== tag) { flush(); list = { tag, items: [] } }
      list.items.push(esc(line.replace(BULLET_RE, '')))
      return
    }
    flush()
    const next = (lines[idx + 1] || '').trim()
    const prevBlank = idx === 0 || !(lines[idx - 1] || '').trim()
    // short line without final punctuation, standing on its own = heading
    const isHeading = line.length <= 80 && !/[.!?:,;)]$/.test(line) && prevBlank && idx > 0 && next !== '' || (line.length <= 80 && !/[.!?:,;)]$/.test(line) && prevBlank && !next && idx > 0)
    out.push(isHeading ? `<h2>${esc(line)}</h2>` : `<p>${esc(line)}</p>`)
  })
  flush()
  return out.join('\n')
}

export const slugifyText = (s) => s.toLowerCase().replace(/<[^>]+>/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60)
