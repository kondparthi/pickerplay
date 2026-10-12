import { Link } from 'react-router-dom'
import { useApp } from '../../store/AppStore'
import { useResource } from './common'
import Icon from '../../components/Icon'

const TILES = [
  ['spins_year', 'Spins this year', 'dice', '#5546c9'],
  ['spins_total', 'Spins all-time', 'refresh', '#0ea5e9'],
  ['hours_year', 'Hours spinning', 'history', '#f59e0b'],
  ['users', 'Registered users', 'users', '#10b981'],
  ['shared_wheels', 'Share links', 'link', '#ec4899'],
  ['public_wheels', 'Gallery wheels', 'grid', '#8b5cf6'],
  ['saved_wheels', 'Saved wheels', 'save', '#06b6d4'],
  ['unread_feedback', 'Unread feedback', 'inbox', '#ef4444'],
]

const ICONS = [['user.', 'user'], ['share.', 'share'], ['settings.', 'palette'], ['admin.post', 'book'], ['admin.wheel', 'dice'], ['admin.user', 'users'], ['admin.page', 'file'], ['admin.tool', 'grid'], ['api_key', 'key']]
const actIcon = (a) => (ICONS.find(([p]) => a.startsWith(p)) || [null, 'history'])[1]
const actLabel = (a) => { const s = a.replace(/^admin\./, '').replace(/[._]+/g, ' '); return s.charAt(0).toUpperCase() + s.slice(1) }
const actDetail = (m) => {
  if (!m || Array.isArray(m) || typeof m !== 'object') return ''
  return m.title || m.code || m.email || m.slug || (Array.isArray(m.keys) ? m.keys.slice(0, 4).join(', ') : '') || (m.id ? `#${m.id}` : '')
}
export const timeAgo = (iso) => {
  const s = (Date.now() - new Date(iso).getTime()) / 1000
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)} min ago`
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`
  if (s < 86400 * 7) return `${Math.floor(s / 86400)} d ago`
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}
const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening' }

export default function Dashboard() {
  const { user } = useApp()
  const [{ data, loading, error }] = useResource('/admin/dashboard')
  const d = data || {}
  const days = d.shares_per_day || []
  const max = Math.max(1, ...days.map((x) => x.count))
  const total14 = days.reduce((a, b) => a + b.count, 0)
  const top = d.top_wheels || []
  const topMax = Math.max(1, ...top.map((w) => w.views))

  return (
    <>
      <section className="db-hero">
        <div>
          <h1>{greeting()}, {user?.name?.split(' ')[0]} 👋</h1>
          <p>Here’s what’s happening on your site today · {new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <div className="db-actions">
          <Link to="/admin/posts" className="btn btn-primary"><Icon name="plus" size={16} /> New post</Link>
          <Link to="/admin/tools" className="btn btn-soft"><Icon name="grid" size={16} /> Picker tools</Link>
          <Link to="/admin/settings" className="btn btn-soft"><Icon name="palette" size={16} /> Branding</Link>
        </div>
      </section>

      {error && <div className="alert error">{error}</div>}

      <section className="db-tiles">
        {TILES.map(([k, label, icon, color]) => (
          <div key={k} className="db-tile card" style={{ '--tc': color }}>
            <span className="db-ic"><Icon name={icon} size={20} /></span>
            <div className="db-num">{loading && !data ? '—' : (d.counts?.[k] ?? 0).toLocaleString()}</div>
            <div className="db-label">{label}</div>
          </div>
        ))}
      </section>

      <section className="db-grid">
        <div className="card db-chart">
          <div className="db-card-head">
            <div><h3>Share links created</h3><span className="muted small">Last 14 days</span></div>
            <div className="db-total"><b>{total14}</b><span>total</span></div>
          </div>
          <div className="db-bars">
            <div className="db-gridlines"><i /><i /><i /><i /></div>
            {days.map((x) => (
              <div key={x.date} className="db-bar-col" title={`${x.date}: ${x.count}`}>
                <div className="db-bar" style={{ height: `${Math.max(2, (x.count / max) * 100)}%` }}>
                  {x.count > 0 && <span>{x.count}</span>}
                </div>
                <em>{new Date(x.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</em>
              </div>
            ))}
          </div>
        </div>

        <div className="card db-top">
          <div className="db-card-head">
            <div><h3>Most viewed wheels</h3><span className="muted small">Shared links</span></div>
            <Link to="/admin/wheels" className="db-more">View all <Icon name="arrowright" size={14} /></Link>
          </div>
          {!top.length && <p className="muted">No shared wheels yet.</p>}
          <ol className="db-rank">
            {top.map((w, i) => (
              <li key={w.share_code}>
                <span className="db-rank-n">{i + 1}</span>
                <div className="db-rank-main">
                  <a href={`/${w.share_code}`} target="_blank" rel="noreferrer">{w.title || w.share_code}</a>
                  <div className="db-rank-bar"><i style={{ width: `${Math.max(3, (w.views / topMax) * 100)}%` }} /></div>
                </div>
                <span className="db-rank-v">{w.views.toLocaleString()}<small>views</small></span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="card db-feed">
        <div className="db-card-head">
          <div><h3>Recent activity</h3><span className="muted small">Logins, edits and new content</span></div>
          <Link to="/admin/activity" className="db-more">Full log <Icon name="arrowright" size={14} /></Link>
        </div>
        <ul>
          {(d.recent_activity || []).map((a) => (
            <li key={a.id}>
              <span className="db-feed-ic"><Icon name={actIcon(a.action)} size={16} /></span>
              <div className="db-feed-main">
                <b>{actLabel(a.action)}</b>
                {actDetail(a.metadata) && <span className="muted"> · {actDetail(a.metadata)}</span>}
              </div>
              <time className="muted small">{timeAgo(a.created_at)}</time>
            </li>
          ))}
          {data && !(d.recent_activity || []).length && <li className="muted">No activity yet.</li>}
        </ul>
      </section>
    </>
  )
}
