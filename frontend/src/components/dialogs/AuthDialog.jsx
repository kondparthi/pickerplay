import { useState } from 'react'
import { useApp } from '../../store/AppStore'
import { api } from '../../lib/api'
import Modal from '../Modal'

export default function AuthDialog({ then, initialTab = 'login' }) {
  const { login, closeDialog, openDialog, t, site, toast } = useApp()
  const [tab, setTab] = useState(initialTab)
  const [f, setF] = useState({ name: '', email: '', password: '', password_confirmation: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    setInfo('')
    try {
      if (tab === 'forgot') {
        const r = await api.post('/auth/forgot-password', { email: f.email })
        setInfo(r.message)
      } else {
        const r = tab === 'login'
          ? await api.post('/auth/login', { email: f.email, password: f.password })
          : await api.post('/auth/register', f)
        login(r.token, r.user)
        toast(`${t('Welcome')}, ${r.user.name}!`)
        if (then) openDialog(then)
        else closeDialog()
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title={tab === 'login' ? t('Sign in') : tab === 'register' ? t('Create account') : t('Reset password')} onClose={closeDialog}>
      {tab !== 'forgot' && (
        <div className="tabs tabs-left">
          <button className={`tab ${tab === 'login' ? 'active' : ''}`} onClick={() => setTab('login')}>{t('Sign in')}</button>
          {site.allow_registration === '1' && (
            <button className={`tab ${tab === 'register' ? 'active' : ''}`} onClick={() => setTab('register')}>{t('Create account')}</button>
          )}
        </div>
      )}
      {error && <div className="alert error">{error}</div>}
      {info && <div className="alert success">{info}</div>}
      <form className="stack" onSubmit={submit}>
        {tab === 'register' && <input className="input" placeholder={t('Name')} value={f.name} onChange={set('name')} required autoComplete="name" />}
        <input className="input" type="email" placeholder={t('Email')} value={f.email} onChange={set('email')} required autoComplete="email" />
        {tab !== 'forgot' && (
          <input className="input" type="password" placeholder={t('Password')} value={f.password} onChange={set('password')} required minLength={tab === 'register' ? 8 : 1} autoComplete={tab === 'login' ? 'current-password' : 'new-password'} />
        )}
        {tab === 'register' && (
          <input className="input" type="password" placeholder={t('Confirm password')} value={f.password_confirmation} onChange={set('password_confirmation')} required minLength={8} autoComplete="new-password" />
        )}
        <button className="btn btn-primary" disabled={busy}>
          {busy ? t('Please wait…') : tab === 'login' ? t('Sign in') : tab === 'register' ? t('Create account') : t('Send reset link')}
        </button>
      </form>
      <div className="auth-links">
        {tab === 'login' && <button className="linkish" onClick={() => setTab('forgot')}>{t('Forgot password?')}</button>}
        {tab === 'forgot' && <button className="linkish" onClick={() => setTab('login')}>{t('Back to sign in')}</button>}
      </div>
    </Modal>
  )
}
