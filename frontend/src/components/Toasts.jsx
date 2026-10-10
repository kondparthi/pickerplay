import { useApp } from '../store/AppStore'
import Icon from './Icon'

export default function Toasts() {
  const { toasts, dismissToast, t } = useApp()
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((x) => (
        <div key={x.id} className={`toast ${x.type || ''}`}>
          <span>{x.message}</span>
          <div className="toast-actions">
            {x.action && (
              <button
                className="toast-btn"
                onClick={() => {
                  x.action.run()
                  dismissToast(x.id)
                }}
              >
                {t(x.action.label)}
              </button>
            )}
            <button className="toast-btn" aria-label="Dismiss" onClick={() => dismissToast(x.id)}>
              <Icon name="x" size={16} />
            </button>
          </div>
          <div className="toast-bar" style={{ animationDuration: `${x.duration || 5000}ms` }} />
        </div>
      ))}
    </div>
  )
}
