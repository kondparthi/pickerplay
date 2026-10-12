import { useEffect, useState } from 'react'
import { NavLink, Route, Routes, Link, useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../../store/AppStore'
import { api } from '../../lib/api'
import { store } from '../../lib/storage'
import Icon from '../../components/Icon'
import Menu from '../../components/Menu'
import Dashboard from './Dashboard'
import SettingsPage from './SettingsPage'
import WheelsPage from './WheelsPage'
import ToolsPage from './ToolsPage'
import PagesPage from './PagesPage'
import PostsPage from './PostsPage'
import UsersPage from './UsersPage'
import FeedbackPage from './FeedbackPage'
import ActivityPage from './ActivityPage'
import '../../admin.css'

const NAV_GROUPS = [
  { title: 'Overview', items: [['', 'dashboard', 'Dashboard']] },
  { title: 'Content', items: [['posts', 'book', 'Blog posts'], ['tools', 'grid', 'Picker tools'], ['pages', 'file', 'Pages'], ['wheels', 'dice', 'Wheels']] },
  { title: 'Community', items: [['users', 'users', 'Users'], ['feedback', 'inbox', 'Feedback']] },
  { title: 'System', items: [['settings', 'palette', 'Branding & settings'], ['activity', 'history', 'Activity log']] },
]
const ALL_ITEMS = NAV_GROUPS.flatMap((g) => g.items)

function useAdminFont() {
  useEffect(() => {
    if (document.getElementById('pp-admin-font')) return
    const l = document.createElement('link')
    l.id = 'pp-admin-font'
    l.rel = 'stylesheet'
    l.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap'
    document.head.appendChild(l)
  }, [])
}

/* ---------------- Login ---------------- */
function AdminLogin() {
  const { site, login, user, logout, openDialog } = useApp()
  const [f, setF] = useState({ email: '', password: '' })
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => { document.title = `Admin sign in | ${site.site_name}` }, [site.site_name])

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setErr('')
    try {
      const r = await api.post('/auth/login', f)
      if (!r.user.is_admin) setErr('This account does not have administrator access.')
      else login(r.token, r.user)
    } catch (x) {
      setErr(x.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="al">
      <section className="al-art">
        <div className="al-blob b1" /><div className="al-blob b2" />
        <Link to="/" className="al-brand">{site.logo_url ? <img src={site.logo_url} alt={site.site_name} /> : site.site_name}</Link>
        <div className="al-wheel-wrap">
          <div className="al-wheel"><span /></div>
          <div className="al-pointer" />
        </div>
        <div className="al-copy">
          <h2>Run your picker platform</h2>
          <p>Branding, pickers, blog posts, users and analytics – all in one place.</p>
          <ul>
            <li><Icon name="palette" size={17} /> White-label branding in minutes</li>
            <li><Icon name="book" size={17} /> Publish SEO-ready blog posts</li>
            <li><Icon name="trend" size={17} /> Track spins, shares and feedback</li>
          </ul>
        </div>
      </section>

      <section className="al-form-wrap">
        <form className="al-form" onSubmit={submit}>
          <Link to="/" className="al-mobile-logo">{site.logo_url && <img src={site.logo_url} alt={site.site_name} />}</Link>
          <span className="al-kicker"><Icon name="shield" size={14} /> Admin panel</span>
          <h1>Welcome back 👋</h1>
          <p className="al-sub">Sign in to manage {site.site_name}.</p>

          {user && !user.is_admin && (
            <div className="alert error">Signed in as {user.email}, which is not an administrator. <button type="button" className="linkish" onClick={logout}>Sign out</button></div>
          )}
          {err && <div className="alert error">{err}</div>}

          <div className="al-field">
            <label htmlFor="al-email">Email address</label>
            <div className="al-input">
              <Icon name="mail" size={18} />
              <input id="al-email" type="email" autoComplete="email" placeholder="admin@example.com" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
            </div>
          </div>
          <div className="al-field">
            <div className="al-label-row">
              <label htmlFor="al-pass">Password</label>
              <button type="button" className="al-link" onClick={() => openDialog('auth', { initialTab: 'forgot' })}>Forgot password?</button>
            </div>
            <div className="al-input">
              <Icon name="lock" size={18} />
              <input id="al-pass" type={show ? 'text' : 'password'} autoComplete="current-password" placeholder="••••••••" required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
              <button type="button" className="al-eye" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}>
                <Icon name={show ? 'eyeoff' : 'eye'} size={18} />
              </button>
            </div>
          </div>

          <button className="al-submit" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'} {!busy && <Icon name="arrowright" size={18} />}
          </button>
          <Link to="/" className="al-back"><Icon name="back" size={15} /> Back to the site</Link>
        </form>
      </section>
    </div>
  )
}

/* ---------------- Shell ---------------- */
export default function Admin() {
  useAdminFont()
  const { user, authChecked, site, logout, prefs, setPrefs } = useApp()
  const nav = useNavigate()
  const loc = useLocation()
  const [collapsed, setCollapsed] = useState(() => store.get('pp.admin.collapsed', false))
  const [drawer, setDrawer] = useState(false)
  const [unread, setUnread] = useState(0)

  useEffect(() => setDrawer(false), [loc.pathname])
  useEffect(() => {
    if (user?.is_admin) api.get('/admin/dashboard').then((r) => setUnread(r.counts?.unread_feedback || 0)).catch(() => {})
  }, [user])

  if (!authChecked) return <div className="page-loading">Loading…</div>
  if (!user || !user.is_admin) return <AdminLogin />

  const seg = loc.pathname.replace(/^\/admin\/?/, '').split('/')[0]
  const current = ALL_ITEMS.find(([p]) => p === seg) || ALL_ITEMS[0]
  const initials = (user.name || user.email).split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase()
  const toggleCollapse = () => setCollapsed((c) => { store.set('pp.admin.collapsed', !c); return !c })

  return (
    <div className={`admin ${collapsed ? 'is-collapsed' : ''}`}>
      <aside className={`ad-side ${drawer ? 'open' : ''}`}>
        <Link to="/admin" className="ad-brand">
          {collapsed
            ? <img src={site.favicon_url || site.logo_url} alt={site.site_name} />
            : site.logo_url ? <img src={site.logo_url} alt={site.site_name} /> : <b>{site.site_name}</b>}
        </Link>
        <nav>
          {NAV_GROUPS.map((g) => (
            <div key={g.title} className="ad-group">
              <div className="ad-group-title">{g.title}</div>
              {g.items.map(([path, icon, label]) => (
                <NavLink key={path} to={`/admin${path ? '/' + path : ''}`} end={!path} className="ad-link" title={collapsed ? label : undefined}>
                  <span className="ad-link-icon"><Icon name={icon} size={19} /></span>
                  <span className="ad-link-text">{label}</span>
                  {path === 'feedback' && unread > 0 && <span className="ad-badge">{unread}</span>}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="ad-side-card">
          <span className="ad-side-emoji">🎡</span>
          <b>Your site is live</b>
          <span>See changes exactly as visitors do.</span>
          <a href="/" target="_blank" rel="noreferrer">Open site <Icon name="external" size={14} /></a>
        </div>
      </aside>
      {drawer && <div className="ad-overlay" onClick={() => setDrawer(false)} />}

      <div className="ad-body">
        <header className="ad-top">
          <button className="ad-icon ad-only-mobile" onClick={() => setDrawer(true)} aria-label="Open menu"><Icon name="menu" /></button>
          <button className="ad-icon ad-only-desktop" onClick={toggleCollapse} aria-label="Collapse sidebar"><Icon name="panel" /></button>
          <div className="ad-crumb">
            <span>Admin</span><Icon name="right" size={14} /><strong>{current[2]}</strong>
          </div>
          <div className="ad-top-right">
            <a href="/" target="_blank" rel="noreferrer" className="ad-chip"><Icon name="external" size={16} /> <span>View site</span></a>
            <button className="ad-icon" onClick={() => setPrefs({ dark: !prefs.dark })} aria-label="Toggle dark mode"><Icon name={prefs.dark ? 'sun' : 'moon'} /></button>
            <Menu
              button={({ toggle }) => (
                <button className="ad-user" onClick={toggle}>
                  <span className="ad-avatar">{initials}</span>
                  <span className="ad-user-text"><b>{user.name}</b><small>Administrator</small></span>
                  <Icon name="down" size={14} />
                </button>
              )}
              items={[
                { label: 'My account', icon: <Icon name="user" />, onClick: () => nav('/account') },
                { label: 'Branding & settings', icon: <Icon name="palette" />, onClick: () => nav('/admin/settings') },
                { divider: true },
                { label: 'Sign out', icon: <Icon name="logout" />, onClick: logout },
              ]}
            />
          </div>
        </header>
        <main className="admin-main">
          <Routes>
            <Route index element={<Dashboard />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="wheels" element={<WheelsPage />} />
            <Route path="tools" element={<ToolsPage />} />
            <Route path="posts" element={<PostsPage />} />
            <Route path="pages" element={<PagesPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="feedback" element={<FeedbackPage />} />
            <Route path="activity" element={<ActivityPage />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
