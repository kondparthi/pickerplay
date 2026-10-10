import { useApp } from '../store/AppStore'
import AdSlot from './AdSlot'
import Icon from './Icon'

export default function LeftColumn() {
  const { activeWheel, openDialog, t, ws } = useApp()
  const w = activeWheel
  const showTitle = w.settings.showTitle !== false
  return (
    <div className="left-col">
      {showTitle && ws.wheels.length === 1 && (
        <div className="wheel-title">
          {w.title ? <h1>{w.title}</h1> : null}
          {!w.locked && (
            <button className="edit-title" onClick={() => openDialog('editTitle')} aria-label={t('Edit title')} title={t('Edit title')}>
              <Icon name="pencil" size={18} />
            </button>
          )}
        </div>
      )}
      {w.description && showTitle && <p className="wheel-desc">{w.description}</p>}
      {w.shareCode && (
        <a className="shared-chip" href={`/${w.shareCode}`} onClick={(e) => { e.preventDefault(); openDialog('share', { existing: true }) }}>
          <Icon name="share" size={16} /> {t('Shared')}: <u>{w.shareCode}</u>
        </a>
      )}
      <AdSlot />
    </div>
  )
}
