import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../store/AppStore'
import { api } from '../lib/api'
import { wheelFromConfig } from '../lib/defaults'
import SimpleLayout from './SimpleLayout'
import Icon from '../components/Icon'

const VIS = { link_spin: 'Spin only', link_copy: 'Spin & copy', public: 'Public gallery' }

export default function Account() {
  const { user, setUser, authChecked, openDialog, t, logout, site, loadWheels, toast } = useApp()
  const nav = useNavigate()
  const [tab, setTab] = useState('wheels')
  const [wheels, setWheels] = useState(null)
  const [shares, setShares] = useState(null)
  const [keys, setKeys] = useState(null)
  const [newKey, setNewKey] = useState(null)
  const [profile, setProfile] = useState({ name: '', email: '' })
  const [pw, setPw] = useState({ current_password: '', password: '', password_confirmation: '' })
  const [msg, setMsg] = useState({ type: '', text: '' })

  useEffect(() => {
    document.title = `${t('My account')} | ${site.site_name}`
  }, [site.site_name, t])

  useEffect(() => {
    if (!user) return
    setProfile({ name: user.name, email: user.email })
    api.get('/wheels').then((r) => setWheels(r.data)).catch(() => setWheels([]))
    api.get('/my/shares').then((r) => setShares(r.data)).catch(() => setShares([]))
    api.get('/api-keys').then((r) => setKeys(r.data)).catch(() => setKeys([]))
  }, [user])

  if (!authChecked) return <SimpleLayout><div className="page-loading">{t('Loading…')}</div></SimpleLayout>
  if (!user) {
    return (
      <SimpleLayout>
        <div className="card prose center pad-lg">
          <h1>{t('My account')}</h1>
          <p>{t('Sign in to manage your saved wheels, share links and API keys.')}</p>
          <button className="btn btn-primary" onClick={() => openDialog('auth')}>{t('Sign in')}</button>
        </div>
      </SimpleLayout>
    )
  }

  const flash = (type, text) => {
    setMsg({ type, text })
    setTimeout(() => setMsg({ type: '', text: '' }), 5000)
  }
  const run = async (fn, ok) => {
    try {
      await fn()
      if (ok) flash('success', ok)
    } catch (e) {
      flash('error', e.message)
    }
  }

  const openWheel = async (id) => {
    const r = await api.get(`/wheels/${id}`)
    loadWheels([wheelFromConfig(r.data.config, site, { title: r.data.title, savedId: r.data.id })], t('Opened') + ': ' + r.data.title)
    nav('/')
  }

  return (
    <SimpleLayout className="account-page">
      <div className="account-head">
        <div>
          <h1>{t('My account')}</h1>
          <p className="muted">{user.name} · {user.email}</p>
        </div>
        <div className="row">
          {user.is_admin && <Link className="btn btn-soft" to="/admin"><Icon name="shield" size={16} /> {t('Admin panel')}</Link>}
          <button className="btn btn-text" onClick={() => logout().then(() => nav('/'))}><Icon name="logout" size={16} /> {t('Sign out')}</button>
        </div>
      </div>
      {msg.text && <div className={`alert ${msg.type}`}>{msg.text}</div>}
      <div className="tabs tabs-left">
        {[['wheels', 'Saved wheels'], ['shares', 'Share links'], ['api', 'API keys'], ['profile', 'Profile']].map(([k, l]) => (
          <button key={k} className={`tab ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>{t(l)}</button>
        ))}
      </div>

      {tab === 'wheels' && (
        <div className="card">
          {wheels === null ? <p className="muted">{t('Loading…')}</p> : !wheels.length ? <p className="muted">{t('No saved wheels yet. Use Save to keep a wheel here.')}</p> : (
            <table className="table">
              <thead><tr><th>{t('Title')}</th><th>{t('Entries')}</th><th>{t('Updated')}</th><th /></tr></thead>
              <tbody>
                {wheels.map((w) => (
                  <tr key={w.id}>
                    <td><button className="linkish" onClick={() => openWheel(w.id)}>{w.title}</button></td>
                    <td>{w.entries_count}</td>
                    <td>{new Date(w.updated_at).toLocaleString()}</td>
                    <td className="right">
                      <button className="icon-btn" aria-label={t('Delete')} onClick={() => window.confirm(t('Delete this wheel permanently?')) && run(async () => { await api.del(`/wheels/${w.id}`); setWheels((l) => l.filter((x) => x.id !== w.id)) })}><Icon name="trash" size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'shares' && (
        <div className="card">
          {shares === null ? <p className="muted">{t('Loading…')}</p> : !shares.length ? <p className="muted">{t('You have not shared any wheels while signed in.')}</p> : (
            <table className="table">
              <thead><tr><th>{t('Link')}</th><th>{t('Title')}</th><th>{t('Visibility')}</th><th>{t('Views')}</th><th /></tr></thead>
              <tbody>
                {shares.map((s) => (
                  <tr key={s.code}>
                    <td><Link to={`/${s.code}`}>{s.code}</Link></td>
                    <td>{s.title || '—'}</td>
                    <td>
                      <select className="input select sm" value={s.visibility} onChange={(e) => run(async () => {
                        await api.put(`/my/shares/${s.code}`, { visibility: e.target.value })
                        setShares((l) => l.map((x) => (x.code === s.code ? { ...x, visibility: e.target.value } : x)))
                      }, t('Saved'))}>
                        {Object.entries(VIS).filter(([k]) => k !== 'public' || site.allow_gallery === '1' || s.visibility === 'public').map(([k, l]) => <option key={k} value={k}>{t(l)}</option>)}
                      </select>
                    </td>
                    <td>{s.views}</td>
                    <td className="right">
                      <button className="icon-btn" aria-label={t('Copy link')} onClick={() => { navigator.clipboard?.writeText(`${window.location.origin}/${s.code}`); toast(t('Copied to clipboard')) }}><Icon name="copy" size={16} /></button>
                      <button className="icon-btn" aria-label={t('Delete')} onClick={() => window.confirm(t('Delete this link? People using it will no longer be able to open the wheel.')) && run(async () => { await api.del(`/my/shares/${s.code}`); setShares((l) => l.filter((x) => x.code !== s.code)) })}><Icon name="trash" size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'api' && (
        <div className="card stack">
          <p>{t('Use API keys to create and read wheels from your own apps.')} <Link to="/page/api">{t('API documentation')}</Link></p>
          {newKey && (
            <div className="alert success">
              <strong>{t('Copy your key now - it will not be shown again:')}</strong>
              <div className="copy-row"><input className="input mono" readOnly value={newKey} onFocus={(e) => e.target.select()} /><button className="btn btn-success" onClick={() => navigator.clipboard?.writeText(newKey)}>{t('Copy')}</button></div>
            </div>
          )}
          <form className="row" onSubmit={(e) => {
            e.preventDefault()
            const name = e.target.keyname.value.trim()
            if (!name) return
            run(async () => {
              const r = await api.post('/api-keys', { name })
              setNewKey(r.plain_key)
              setKeys((k) => [r.data, ...(k || [])])
              e.target.reset()
            })
          }}>
            <input name="keyname" className="input" placeholder={t('Key name, e.g. "My website"')} maxLength={100} />
            <button className="btn btn-primary">{t('Create key')}</button>
          </form>
          {keys && keys.length > 0 && (
            <table className="table">
              <thead><tr><th>{t('Name')}</th><th>{t('Key')}</th><th>{t('Requests')}</th><th>{t('Last used')}</th><th /></tr></thead>
              <tbody>
                {keys.map((k) => (
                  <tr key={k.id}>
                    <td>{k.name}</td>
                    <td className="mono">{k.prefix}…</td>
                    <td>{k.requests}</td>
                    <td>{k.last_used_at ? new Date(k.last_used_at).toLocaleString() : '—'}</td>
                    <td className="right"><button className="btn btn-text danger small" onClick={() => window.confirm(t('Revoke this key?')) && run(async () => { await api.del(`/api-keys/${k.id}`); setKeys((l) => l.filter((x) => x.id !== k.id)) })}>{t('Revoke')}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'profile' && (
        <div className="account-grid">
          <form className="card stack" onSubmit={(e) => { e.preventDefault(); run(async () => { const r = await api.put('/auth/profile', profile); setUser(r.user) }, t('Profile updated')) }}>
            <h3>{t('Profile')}</h3>
            <input className="input" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} placeholder={t('Name')} required />
            <input className="input" type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} placeholder={t('Email')} required />
            <button className="btn btn-primary">{t('Save')}</button>
          </form>
          <form className="card stack" onSubmit={(e) => { e.preventDefault(); run(async () => { await api.put('/auth/password', pw); setPw({ current_password: '', password: '', password_confirmation: '' }) }, t('Password changed')) }}>
            <h3>{t('Change password')}</h3>
            <input className="input" type="password" autoComplete="current-password" placeholder={t('Current password')} value={pw.current_password} onChange={(e) => setPw({ ...pw, current_password: e.target.value })} required />
            <input className="input" type="password" autoComplete="new-password" placeholder={t('New password')} minLength={8} value={pw.password} onChange={(e) => setPw({ ...pw, password: e.target.value })} required />
            <input className="input" type="password" autoComplete="new-password" placeholder={t('Confirm password')} minLength={8} value={pw.password_confirmation} onChange={(e) => setPw({ ...pw, password_confirmation: e.target.value })} required />
            <button className="btn btn-primary">{t('Change password')}</button>
          </form>
          <form className="card stack danger-zone" onSubmit={(e) => {
            e.preventDefault()
            if (!window.confirm(t('Delete your account and all saved wheels? This cannot be undone.'))) return
            run(async () => { await api.del('/auth/account?password=' + encodeURIComponent(e.target.pw.value)); await logout(); nav('/') })
          }}>
            <h3>{t('Delete account')}</h3>
            <p className="muted small">{t('Saved wheels are deleted. Share links you created keep working anonymously until they expire.')}</p>
            <input name="pw" className="input" type="password" placeholder={t('Password')} required />
            <button className="btn btn-danger">{t('Delete my account')}</button>
          </form>
        </div>
      )}
    </SimpleLayout>
  )
}
