import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../store/AppStore'
import { api } from '../lib/api'
import Icon from '../components/Icon'
import SimpleLayout from './SimpleLayout'

const TOPICS = ['General question', 'Report a problem', 'Suggest a new tool', 'Business or advertising', 'Privacy request']

/** Contact Us page – messages arrive in Admin → Feedback and by email (support@…). */
export default function Contact() {
  const { site, t } = useApp()
  const email = site.contact_email || 'support@pickerplay.com'
  const [f, setF] = useState({ name: '', email: '', subject: TOPICS[0], message: '', website: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }))

  useEffect(() => {
    document.title = `${t('Contact Us')} | ${site.site_name}`
    window.scrollTo(0, 0)
  }, [site.site_name, t])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!f.email.trim()) return setError(t('Please enter your email so we can reply.'))
    if (f.message.trim().length < 10) return setError(t('Please write a little more about your question.'))
    setBusy(true)
    try {
      await api.post('/feedback', { ...f, type: 'contact', page_url: window.location.href })
      setSent(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <SimpleLayout>
      <article className="card prose page-article contact-page">
        <h1>{t('Contact Us')}</h1>
        <p>{t('Have a question, found a problem, or have an idea for a new picker? We would love to hear from you. We usually reply within 2 business days.')}</p>

        <div className="contact-grid">
          <div className="contact-info">
            <div className="contact-item">
              <span className="contact-ic"><Icon name="mail" size={20} /></span>
              <div><b>{t('Email')}</b><a href={`mailto:${email}`}>{email}</a></div>
            </div>
            <div className="contact-item">
              <span className="contact-ic"><Icon name="history" size={20} /></span>
              <div><b>{t('Response time')}</b><span>{t('Within 2 business days (Monday–Friday)')}</span></div>
            </div>
            <div className="contact-item">
              <span className="contact-ic"><Icon name="help" size={20} /></span>
              <div><b>{t('Quick answers')}</b><span>{t('Many questions are answered in our')} <Link to="/page/faq">FAQ</Link>.</span></div>
            </div>
            <div className="contact-item">
              <span className="contact-ic"><Icon name="lock" size={20} /></span>
              <div><b>{t('Your privacy')}</b><span>{t('We only use your details to reply.')} <Link to="/page/privacy">{t('Privacy Policy')}</Link></span></div>
            </div>
          </div>

          {sent ? (
            <div className="contact-sent" role="status">
              <span className="pl-check"><Icon name="check" size={22} /></span>
              <h2>{t('Thank you – your message has been sent!')}</h2>
              <p>{t('We have received your message and will reply to')} <b>{f.email}</b> {t('within 2 business days.')}</p>
              <button className="btn btn-soft" onClick={() => { setSent(false); setF((x) => ({ ...x, message: '' })) }}>{t('Send another message')}</button>
            </div>
          ) : (
            <form className="contact-form" onSubmit={submit} noValidate>
              <label>{t('Your name')}<input className="input" value={f.name} maxLength={120} onChange={set('name')} autoComplete="name" /></label>
              <label><span>{t('Your email')} <span className="req">*</span></span><input className="input" type="email" required value={f.email} maxLength={190} onChange={set('email')} autoComplete="email" /></label>
              <label>{t('Topic')}
                <select className="input select" value={f.subject} onChange={set('subject')}>
                  {TOPICS.map((x) => <option key={x} value={x}>{t(x)}</option>)}
                </select>
              </label>
              <label><span>{t('Message')} <span className="req">*</span></span><textarea className="input" rows={6} required value={f.message} maxLength={5000} onChange={set('message')} /></label>
              <input className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" value={f.website} onChange={set('website')} />
              {error && <div className="alert error">{error}</div>}
              <button className="btn btn-primary" disabled={busy}><Icon name="mail" size={16} /> {busy ? t('Sending…') : t('Send message')}</button>
            </form>
          )}
        </div>
      </article>
    </SimpleLayout>
  )
}
