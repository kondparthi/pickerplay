import { useState } from 'react'
import { useApp } from '../../store/AppStore'
import { api } from '../../lib/api'
import Modal from '../Modal'

export default function FeedbackDialog({ type = 'feedback' }) {
  const { closeDialog, t, user, toast } = useApp()
  const [f, setF] = useState({ name: user?.name || '', email: user?.email || '', type, message: '', website: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }))
  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const r = await api.post('/feedback', { ...f, page_url: window.location.href })
      toast(r.message || t('Thank you!'))
      closeDialog()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <Modal title={type === 'ad_report' ? t('Report bad ad') : t('Feedback')} onClose={closeDialog}>
      {error && <div className="alert error">{error}</div>}
      <form className="stack" onSubmit={submit}>
        <select className="input select" value={f.type} onChange={set('type')}>
          <option value="feedback">{t('General feedback')}</option>
          <option value="idea">{t('Feature idea')}</option>
          <option value="bug">{t('Something is broken')}</option>
          <option value="ad_report">{t('Report bad ad')}</option>
          <option value="wheel_report">{t('Report a wheel')}</option>
        </select>
        <div className="row">
          <input className="input" placeholder={t('Name (optional)')} value={f.name} onChange={set('name')} />
          <input className="input" type="email" placeholder={t('Email (optional)')} value={f.email} onChange={set('email')} />
        </div>
        <textarea className="input" rows={6} required minLength={3} placeholder={type === 'ad_report' ? t('Which ad was it and what was wrong?') : t('Tell us what you think…')} value={f.message} onChange={set('message')} />
        <input className="hp" tabIndex={-1} autoComplete="off" value={f.website} onChange={set('website')} aria-hidden="true" />
        <button className="btn btn-primary" disabled={busy}>{busy ? t('Sending…') : t('Send')}</button>
      </form>
    </Modal>
  )
}
