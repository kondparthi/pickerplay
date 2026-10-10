import { Link } from 'react-router-dom'
import { PageHead, useResource, fmtDate } from './common'

const TILES = [
  ['spins_year', 'Spins this year'], ['spins_total', 'Spins all-time'], ['hours_year', 'Hours spinning (year)'],
  ['users', 'Registered users'], ['saved_wheels', 'Saved wheels'], ['shared_wheels', 'Share links'],
  ['public_wheels', 'Public gallery wheels'], ['unread_feedback', 'Unread feedback'],
]

export default function Dashboard() {
  const [{ data, loading, error }] = useResource('/admin/dashboard')
  const d = data || {}
  const max = Math.max(1, ...(d.shares_per_day || []).map((x) => x.count))
  return (
    <>
      <PageHead title="Dashboard" />
      {error && <div className="alert error">{error}</div>}
      {loading && !data ? <p className="muted">Loading…</p> : (
        <>
          <div className="tiles">
            {TILES.map(([k, l]) => (
              <div key={k} className="tile card">
                <div className="tile-num">{(d.counts?.[k] ?? 0).toLocaleString()}</div>
                <div className="muted small">{l}</div>
              </div>
            ))}
          </div>
          <div className="admin-grid-2">
            <section className="card">
              <h3>Share links created – last 14 days</h3>
              <div className="bars">
                {(d.shares_per_day || []).map((x) => (
                  <div key={x.date} className="bar-col" title={`${x.date}: ${x.count}`}>
                    <span className="bar-val">{x.count || ''}</span>
                    <div className="bar" style={{ height: `${(x.count / max) * 100}%` }} />
                    <span className="bar-label">{x.date.slice(5)}</span>
                  </div>
                ))}
              </div>
            </section>
            <section className="card">
              <h3>Most viewed wheels</h3>
              <table className="table">
                <tbody>
                  {(d.top_wheels || []).map((w) => (
                    <tr key={w.share_code}>
                      <td><Link to={`/${w.share_code}`} target="_blank">{w.title || w.share_code}</Link></td>
                      <td className="muted">{w.visibility}</td>
                      <td className="right">{w.views.toLocaleString()} views</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </div>
          <section className="card">
            <h3>Recent activity</h3>
            <table className="table">
              <tbody>
                {(d.recent_activity || []).map((a) => (
                  <tr key={a.id}><td className="mono small">{a.action}</td><td className="muted small">{JSON.stringify(a.metadata)}</td><td className="right muted small">{fmtDate(a.created_at)}</td></tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}
    </>
  )
}
