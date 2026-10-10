import { useEffect, useRef, useState } from 'react'

/** Small dropdown menu. `items`: [{ label, icon, onClick, divider }] */
export default function Menu({ button, items, align = 'right', className = '' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    const close = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false)
    }
    const esc = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', esc)
    }
  }, [open])
  return (
    <div className={`menu-wrap ${className}`} ref={ref}>
      {button({ open, toggle: () => setOpen((o) => !o) })}
      {open && (
        <div className={`menu menu-${align}`} role="menu">
          {items.filter(Boolean).map((it, i) =>
            it.divider ? (
              <div key={i} className="menu-divider" />
            ) : (
              <button
                key={i}
                role="menuitem"
                className="menu-item"
                disabled={it.disabled}
                onClick={() => {
                  setOpen(false)
                  it.onClick?.()
                }}
              >
                {it.icon}
                <span>{it.label}</span>
              </button>
            )
          )}
        </div>
      )}
    </div>
  )
}
