import { useEffect, useRef } from 'react'
import Icon from './Icon'

// stack so Escape only closes the top-most dialog (dialogs can be nested)
const stack = []

export default function Modal({ title, onClose, children, footer, wide = false, className = '', hideClose = false }) {
  const ref = useRef(null)
  useEffect(() => {
    const token = {}
    stack.push(token)
    const onKey = (e) => {
      if (e.key === 'Escape' && stack[stack.length - 1] === token) {
        e.stopPropagation()
        onClose?.()
      }
    }
    document.addEventListener('keydown', onKey)
    const prev = document.activeElement
    ref.current?.querySelector('input:not([type=hidden]),textarea,button,select')?.focus({ preventScroll: true })
    document.body.classList.add('modal-open')
    return () => {
      document.removeEventListener('keydown', onKey)
      stack.splice(stack.indexOf(token), 1)
      if (!stack.length) document.body.classList.remove('modal-open')
      prev?.focus?.({ preventScroll: true })
    }
  }, [onClose])
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div ref={ref} className={`modal ${wide ? 'modal-wide' : ''} ${className}`} role="dialog" aria-modal="true" aria-label={typeof title === 'string' ? title : undefined}>
        {(title || !hideClose) && (
          <div className="modal-head">
            {title ? <h2>{title}</h2> : <span />}
            {!hideClose && (
              <button className="icon-btn" onClick={onClose} aria-label="Close">
                <Icon name="x" />
              </button>
            )}
          </div>
        )}
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  )
}
