import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useApp } from '../store/AppStore'
import Icon from './Icon'
import '../megamenu.css'
import ToolIcon from './ToolIcon'

// Column layout for the mega menu. Tools added later in /admin that are not
// listed here appear automatically under "More pickers".
const GROUPS = [
  { title: 'Popular', slugs: ['__wheel', '__team', '__poll', 'yes-no-wheel', 'truth-or-dare-wheel'] },
  { title: 'Decisions & games', slugs: ['yes-no-maybe-wheel', 'coin-flip-wheel', 'dice-roller-wheel', 'what-to-eat-wheel', 'day-picker'] },
  { title: 'Numbers, letters & colors', slugs: ['number-picker', 'number-picker-1-100', 'letter-picker', 'color-picker'] },
  { title: 'Places & sports', slugs: ['country-picker', 'state-picker', 'nba-team-picker', 'nfl-team-picker', 'mlb-team-picker'] },
]

const BUILTIN = {
  __wheel: { slug: '', name: 'Wheel spinner', emoji: '🎡', desc: 'Spin any list of names' },
  __team: { slug: 'team-picker', name: 'Team Picker', emoji: '👥', desc: 'Split names into teams' },
  __poll: { slug: 'polling-wheel', name: 'Polling Wheel', emoji: '🗳️', desc: 'Share a poll, see live votes', badge: 'New' },
}

export default function MegaMenu({ onNavigate }) {
  const { boot, t } = useApp()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ left: 16 })
  const wrapRef = useRef(null)
  const btnRef = useRef(null)
  const panelRef = useRef(null)
  const hoverTimer = useRef(null)

  const tools = boot.tools || []
  const bySlug = Object.fromEntries(tools.map((x) => [x.slug, x]))
  const used = new Set()
  const columns = GROUPS.map((g) => ({
    title: g.title,
    items: g.slugs
      .map((s) => {
        used.add(s)
        return BUILTIN[s] || bySlug[s]
      })
      .filter(Boolean),
  })).filter((c) => c.items.length)
  const extra = tools.filter((x) => !used.has(x.slug))
  if (extra.length) columns.push({ title: 'More pickers', items: extra })

  // close on route change / outside click / Escape
  useEffect(() => setOpen(false), [pathname])
  useEffect(() => {
    if (!open) return
    const onDown = (e) => { if (!wrapRef.current?.contains(e.target)) setOpen(false) }
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  // keep the wide panel inside the viewport, aligned under the button where possible
  useLayoutEffect(() => {
    if (!open || !btnRef.current || !panelRef.current) return
    if (window.innerWidth <= 760) return setPos({ left: 0 })
    const b = btnRef.current.getBoundingClientRect()
    const w = panelRef.current.offsetWidth
    const left = Math.max(16, Math.min(b.left - 24, window.innerWidth - w - 16))
    setPos({ left })
  }, [open])

  const hoverable = () => typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (min-width: 761px)').matches
  const enter = () => { if (!hoverable()) return; clearTimeout(hoverTimer.current); setOpen(true) }
  const leave = () => { if (!hoverable()) return; clearTimeout(hoverTimer.current); hoverTimer.current = setTimeout(() => setOpen(false), 180) }

  const isCurrent = (slug) => pathname === '/' + slug

  return (
    <div className="mm-wrap" ref={wrapRef} onMouseEnter={enter} onMouseLeave={leave}>
      <button ref={btnRef} className={`tb-btn ${open ? 'active' : ''}`} aria-expanded={open} aria-haspopup="true" onClick={() => setOpen((o) => (hoverable() ? true : !o))}>
        <Icon name="grid" />
        <span>{t('Pickers')}</span>
        <Icon name="down" size={14} style={{ transform: open ? 'rotate(180deg)' : '', transition: 'transform .2s' }} />
      </button>
      {open && (
        <div className="mm-panel" ref={panelRef} style={{ left: pos.left }} role="menu">
          <div className="mm-cols">
            {columns.map((col) => (
              <div key={col.title} className="mm-col">
                <div className="mm-title">{t(col.title)}</div>
                {col.items.map((tool) => (
                  <Link
                    key={tool.slug || 'wheel'}
                    to={'/' + tool.slug}
                    role="menuitem"
                    className={`mm-item ${isCurrent(tool.slug) ? 'current' : ''}`}
                    onClick={() => { setOpen(false); onNavigate?.() }}
                  >
                    <span className="mm-icon"><ToolIcon icon={tool.emoji} /></span>
                    <span className="mm-text">
                      <span className="mm-name">{t(tool.name)}{tool.badge && <em className="mm-badge">{t(tool.badge)}</em>}</span>
                      {tool.desc && <span className="mm-desc">{t(tool.desc)}</span>}
                    </span>
                  </Link>
                ))}
              </div>
            ))}
          </div>
          <div className="mm-foot">
            <Link to="/gallery" className="mm-all" onClick={() => { setOpen(false); onNavigate?.() }}>
              <Icon name="search" size={16} /> {t('Browse the wheel gallery')}
            </Link>
            <Link to="/" className="mm-all mm-primary" onClick={() => { setOpen(false); onNavigate?.() }}>
              🎡 {t('Make your own wheel')}
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
