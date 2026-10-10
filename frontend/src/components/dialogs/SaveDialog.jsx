import { useState } from 'react'
import { useApp } from '../../store/AppStore'
import { api } from '../../lib/api'
import { wheelToConfig } from '../../lib/defaults'
import { downloadJson } from '../../lib/storage'
import Modal from '../Modal'
import Icon from '../Icon'

export function exportFile(wheels, siteName) {
  return { app: siteName || 'PickerPlay', format: 'pickerplay-wheel', version: 1, exportedAt: new Date().toISOString(), wheels: wheels.map(wheelToConfig) }
}

export default function SaveDialog() {
  const { activeWheel, ws, updateWheel, closeDialog, t, user, openDialog, toast, site } = useApp()
  const [title, setTitle] = useState(activeWheel.title || '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const save = async (asNew) => {
    if (!title.trim()) return setError(t('Please enter a title.'))
    setBusy(true)
    setError('')
    const config = wheelToConfig({ ...activeWheel, title })
    try {
      const body = { title: title.trim(), description: activeWheel.description || '', config }
      const r = activeWheel.savedId && !asNew ? await api.put(`/wheels/${activeWheel.savedId}`, body) : await api.post('/wheels', body)
      updateWheel(ws.active, { title: title.trim(), savedId: r.data.id })
      toast(t('Wheel saved to your account'))
      closeDialog()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const download = () => {
    const name = (title || activeWheel.title || 'wheel').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-') || 'wheel'
    downloadJson(`${name}.wheel.json`, exportFile(ws.wheels.map((w, i) => (i === ws.active ? { ...w, title } : w)), site.site_name))
    closeDialog()
  }

  return (
    <Modal title={t('Save wheel')} onClose={closeDialog}>
      {error && <div className="alert error">{error}</div>}
      <div className="save-options">
        <section className="save-card">
          <h3><Icon name="user" /> {t('Save to my account')}</h3>
          {user ? (
            <>
              <input className="input" placeholder={t('Wheel title')} value={title} maxLength={150} onChange={(e) => setTitle(e.target.value)} />
              <div className="row">
                <button className="btn btn-primary" disabled={busy} onClick={() => save(false)}>
                  {activeWheel.savedId ? t('Save changes') : t('Save')}
                </button>
                {activeWheel.savedId && (
                  <button className="btn btn-soft" disabled={busy} onClick={() => save(true)}>{t('Save as new wheel')}</button>
                )}
              </div>
              <p className="muted small">{t('Open it later from any device with Open → My wheels.')}</p>
            </>
          ) : (
            <>
              <p className="muted">{t('Sign in to keep your wheels in the cloud and open them from any device.')}</p>
              <button className="btn btn-primary" onClick={() => openDialog('auth', { then: 'save' })}>{t('Sign in or create account')}</button>
            </>
          )}
        </section>
        <section className="save-card">
          <h3><Icon name="download" /> {t('Save to this device')}</h3>
          <p className="muted">{t('Download a file with all your wheels. Nothing is uploaded.')}</p>
          <button className="btn btn-soft" onClick={download}>{t('Download file')}</button>
        </section>
      </div>
    </Modal>
  )
}
