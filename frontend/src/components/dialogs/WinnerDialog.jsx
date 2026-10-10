import { useApp } from '../../store/AppStore'
import { contrastText } from '../../lib/colors'
import { popSound } from '../../lib/audio'
import Modal from '../Modal'

export default function WinnerDialog({ items }) {
  const { ws, t, closeDialog, setEntries } = useApp()
  const first = items[0]
  const wheel = ws.wheels[first.wheelIndex]
  const s = wheel?.settings || {}
  const color = first.color || 'var(--primary)'
  const fg = first.color ? contrastText(first.color) : '#fff'

  const removeOne = () => {
    items.forEach((it) => {
      const w = ws.wheels[it.wheelIndex]
      if (!w) return
      const idx = w.entries.findIndex((e) => e.id === it.entry.id)
      if (idx >= 0) setEntries(it.wheelIndex, w.entries.filter((_, i) => i !== idx))
    })
    if (s.clickOnRemove) popSound(s.afterVolume ?? 50)
    closeDialog()
  }
  const removeAll = () => {
    items.forEach((it) => {
      const w = ws.wheels[it.wheelIndex]
      if (!w) return
      const txt = (it.entry.text || '').trim().toLowerCase()
      setEntries(it.wheelIndex, w.entries.filter((e) => (e.text || '').trim().toLowerCase() !== txt || (e.image || '') !== (it.entry.image || '')))
    })
    if (s.clickOnRemove) popSound(s.afterVolume ?? 50)
    closeDialog()
  }
  const dupes = items.length === 1 && wheel
    ? wheel.entries.filter((e) => (e.text || '').trim().toLowerCase() === (first.entry.text || '').trim().toLowerCase()).length
    : 0

  return (
    <Modal onClose={closeDialog} hideClose className="winner-modal">
      <div className="winner-head" style={{ background: color, color: fg }}>
        {s.popupMessage || t('We have a winner!')}
      </div>
      <div className="winner-body">
        {items.map((it, i) => (
          <div key={i} className="winner-item">
            {items.length > 1 && <div className="muted small">{ws.wheels[it.wheelIndex]?.title || `${t('Wheel')} ${it.wheelIndex + 1}`}</div>}
            {it.entry.image && <img className="winner-img" src={it.entry.image} alt="" />}
            <div className="winner-name">{it.entry.text}</div>
            {it.entry.message && <p className="winner-msg">{it.entry.message}</p>}
          </div>
        ))}
      </div>
      <div className="modal-foot">
        <button className="btn btn-text" onClick={closeDialog}>{t('Close')}</button>
        {s.showRemove !== false && !wheel?.locked && (
          <>
            {dupes > 1 && (
              <button className="btn btn-soft" onClick={removeAll}>
                {t('Remove all instances')}
              </button>
            )}
            <button className="btn btn-primary" onClick={removeOne}>
              {t('Remove')}
            </button>
          </>
        )}
      </div>
    </Modal>
  )
}
