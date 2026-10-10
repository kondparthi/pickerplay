import { NavLink, Route, Routes, Link } from 'react-router-dom'
import { useApp } from '../../store/AppStore'
import Icon from '../../components/Icon'
import Dashboard from './Dashboard'
import SettingsPage from './SettingsPage'
import WheelsPage from './WheelsPage'
import ToolsPage from './ToolsPage'
import PagesPage from './PagesPage'
import UsersPage from './UsersPage'
import FeedbackPage from './FeedbackPage'
import ActivityPage from './ActivityPage'
import '../../admin.css'

const NAV = [
  ['', 'dashboard', 'Dashboard'],
  ['settings', 'palette', 'Branding & settings'],
  ['wheels', 'dice', 'Wheels'],
  ['tools', 'grid', 'Picker tools'],
  ['pages', 'file', 'Pages'],
  ['users', 'users', 'Users'],
  ['feedback', 'inbox', 'Feedback'],
  ['activity', 'history', 'Activity log'],
]

export default function Admin() {
  const { user, authChecked, openDialog, site, logout } = useApp()

  if (!authChecked) return <div className="page-loading">Loading…</div>
  if (!user || !user.is_admin) {
    return (
      <div className="admin-login">
        <div className="card center pad-lg">
          {site.logo_url && <img src={site.logo_url} alt={site.site_name} style={{ height: 48 }} />}
          <h1>Admin panel</h1>
          <p className="muted">{user ? 'Your account does not have administrator access.' : 'Sign in with an administrator account.'}</p>
          {!user && <button className="btn btn-primary" onClick={() => openDialog('auth')}>Sign in</button>}
          <p><Link to="/">← Back to the site</Link></p>
        </div>
      </div>
    )
  }

  return (
    <div className="admin">
      <aside className="admin-side">
        <Link to="/" className="admin-brand">
          {site.logo_url ? <img src={site.logo_url} alt={site.site_name} /> : site.site_name}
        </Link>
        <nav>
          {NAV.map(([path, icon, label]) => (
            <NavLink key={path} to={`/admin${path ? '/' + path : ''}`} end={!path} className="admin-link">
              <Icon name={icon} size={18} /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="admin-side-foot">
          <div className="muted small">{user.name}<br />{user.email}</div>
          <button className="btn btn-text small" onClick={logout}><Icon name="logout" size={16} /> Sign out</button>
        </div>
      </aside>
      <main className="admin-main">
        <Routes>
          <Route index element={<Dashboard />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="wheels" element={<WheelsPage />} />
          <Route path="tools" element={<ToolsPage />} />
          <Route path="pages" element={<PagesPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="feedback" element={<FeedbackPage />} />
          <Route path="activity" element={<ActivityPage />} />
        </Routes>
      </main>
    </div>
  )
}
