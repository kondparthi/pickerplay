import { useMemo, useState } from 'react'
import { useResource } from './common'
import Icon from '../../components/Icon'
import { Delta, GameBars, TrendChart, fmtDay } from './charts'

const RANGES = [[7, '7 days'], [14, '14 days'], [30, '30 days'], [90, '90 days'], [365, '12 months']]
export const TYPE_LABEL = {
  home: 'Wheel (home)', team: 'Team Picker', tool: 'Picker game', gallery: 'Gallery', blog_list: 'Blog list',
  blog: 'Blog post', page: 'Page', share: 'Shared wheel', embed: 'Embedded wheel', other: 'Other',
}
const METRICS = [['visitors', 'Visitors'], ['views', 'Views'], ['spins', 'Spins']]

const ago = (d) => {
  if (!d) return null
  const days = Math.round((Date.now() - new Date(d + 'T00:00:00').getTime()) / 86400000)
  return days <= 0 ? 'today' : days === 1 ? 'yesterday' : `${days} days ago`
}

export default function AnalyticsPage() {
  const [days, setDays] = useState(30)
  const [{ data, loading, error }, reload] = useResource(`/admin/analytics?days=${days}`)
  const [metric, setMetric] = useState('visitors')
  const [showTable, setShowTable] = useState(false)
  const [q, setQ] = useState('')
  const [type, setType] = useState('')
  const [sort, setSort] = useState(['views', -1])

  const d = data || {}
  const t = d.totals || {}
  const games = d.games || []
  const series = d.series || []
  const byGame = useMemo(() => [...games].sort((a, b) => (b[metric] || 0) - (a[metric] || 0)), [games, metric])
  const rare = useMemo(() => [...games].sort((a, b) => (a.views - b.views) || a.label.localeCompare(b.label)).slice(0, 8), [games])
  const typeMax = Math.max(1, ...(d.by_type || []).map((x) => x.views))

  const pages = useMemo(() => {
    const s = q.trim().toLowerCase()
    const list = (d.pages || []).filter((p) => (!type || p.type === type) && (!s || p.path.toLowerCase().includes(s) || (p.label || '').toLowerCase().includes(s)))
    const [k, dir] = sort
    return list.sort((a, b) => (k === 'label' || k === 'path' || k === 'last_date'
      ? String(a[k] || '').localeCompare(String(b[k] || '')) : (a[k] || 0) - (b[k] || 0)) * dir)
  }, [d.pages, q, type, sort])

  const th = (k, label) => (
    <th className="an-sort" onClick={() => setSort(([sk, sd]) => [k, sk === k ? -sd : -1])}>
      {label}{sort[0] === k && <span>{sort[1] < 0 ? ' ↓' : ' ↑'}</span>}
    </th>
  )

  const kpis = [
    ['Page views', t.views, t.prev_views, 'eye'],
    ['Unique visitors', t.visitors, t.prev_visitors, 'users'],
    ['Spins & picks', t.spins, t.prev_spins, 'dice'],
    ['Pages / visitor', t.pages_per_visitor, null, 'trend'],
  ]
  const empty = data && !t.views && !t.spins

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Analytics</h1>
          <p className="muted small" style={{ margin: '4px 0 0' }}>Cookie-free, first-party visitor counts. Bots and Do-Not-Track browsers are not counted.</p>
        </div>
        <div className="row">
          <div className="an-seg" role="tablist" aria-label="Date range">
            {RANGES.map(([v, l]) => (
              <button key={v} role="tab" aria-selected={days === v} className={days === v ? 'on' : ''} onClick={() => setDays(v)}>{l}</button>
            ))}
          </div>
          <button className="btn btn-soft" onClick={reload} title="Refresh"><Icon name="refresh" size={16} /></button>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}
      {empty && (
        <div className="an-empty card">
          <Icon name="sparkles" size={22} />
          <div><b>Counting has started.</b> Numbers appear as soon as visitors open pages and spin wheels — there is no history from before analytics was installed.</div>
        </div>
      )}

      <section className="an-kpis">
        {kpis.map(([label, now, prev, icon]) => (
          <div key={label} className="card an-kpi">
            <div className="an-kpi-top"><span>{label}</span><Icon name={icon} size={17} /></div>
            <div className="an-kpi-num">{loading && !data ? '—' : (now ?? 0).toLocaleString()}</div>
            {prev != null ? <div className="an-kpi-foot"><Delta now={now} prev={prev} /> <span className="muted">vs previous {days} days</span></div>
              : <div className="an-kpi-foot muted">average in this period</div>}
          </div>
        ))}
      </section>

      <section className="card an-card">
        <div className="db-card-head">
          <div><h3>Visitors over time</h3><span className="muted small">Daily page views and unique visitors · last {days} days</span></div>
          <button className="btn btn-soft small" onClick={() => setShowTable((v) => !v)}>
            <Icon name={showTable ? 'chart' : 'list'} size={15} /> {showTable ? 'Chart' : 'Table'}
          </button>
        </div>
        {showTable ? (
          <div className="table-wrap an-scroll">
            <table className="table">
              <thead><tr><th>Date</th><th className="num">Views</th><th className="num">Visitors</th><th className="num">Spins</th></tr></thead>
              <tbody>
                {[...series].reverse().map((r) => (
                  <tr key={r.date}><td>{fmtDay(r.date, true)}</td><td className="num">{r.views.toLocaleString()}</td><td className="num">{r.visitors.toLocaleString()}</td><td className="num">{r.spins.toLocaleString()}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <TrendChart data={series} />}
      </section>

      <section className="an-grid">
        <div className="card an-card">
          <div className="db-card-head">
            <div><h3>Game-wise traffic</h3><span className="muted small">Every picker game, most popular first</span></div>
            <div className="an-seg small">
              {METRICS.map(([k, l]) => <button key={k} className={metric === k ? 'on' : ''} onClick={() => setMetric(k)}>{l}</button>)}
            </div>
          </div>
          <GameBars games={byGame} metric={metric} />
        </div>

        <div className="card an-card">
          <div className="db-card-head">
            <div><h3>Rarely used games</h3><span className="muted small">Fewest views in this period</span></div>
          </div>
          <ul className="an-rare">
            {rare.map((g) => (
              <li key={g.path}>
                <span className="an-rare-emoji">{g.emoji || '🎯'}</span>
                <div>
                  <a href={g.path} target="_blank" rel="noreferrer">{g.label}</a>
                  <span className="muted small">
                    {g.last_ever ? `Last visit ${ago(g.last_ever)}` : 'No visits recorded yet'}
                  </span>
                </div>
                <span className={`an-pill ${g.views ? '' : 'zero'}`}>{g.views.toLocaleString()} views</span>
              </li>
            ))}
            {data && !rare.length && <li className="muted">No games yet.</li>}
          </ul>
          <p className="muted small an-hint">Tip: improve these pages’ content or link to them from popular games and the blog.</p>
        </div>
      </section>

      <section className="card an-card">
        <div className="db-card-head">
          <div><h3>Views by section</h3><span className="muted small">Which kinds of pages people open</span></div>
        </div>
        <ul className="an-bars">
          {(d.by_type || []).map((x) => (
            <li key={x.type} onClick={() => setType(x.type)} title={`Filter the table to ${TYPE_LABEL[x.type] || x.type}`}>
              <span className="an-bar-label">{TYPE_LABEL[x.type] || x.type}</span>
              <span className="an-bar-track"><i style={{ width: `${Math.max(1.5, (x.views / typeMax) * 100)}%` }} /></span>
              <span className="an-bar-val">{x.views.toLocaleString()}<small> · {x.visitors.toLocaleString()} visitors</small></span>
            </li>
          ))}
          {data && !(d.by_type || []).length && <li className="muted">No page views yet.</li>}
        </ul>
      </section>

      <section className="card an-card">
        <div className="db-card-head an-wrap">
          <div><h3>Page-wise visitors</h3><span className="muted small">Top 100 pages · click a column to sort</span></div>
          <div className="row">
            <div className="an-search"><Icon name="search" size={15} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search page or URL" /></div>
            <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">All sections</option>
              {Object.entries(TYPE_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </div>
        </div>
        <div className="table-wrap an-scroll">
          <table className="table">
            <thead>
              <tr>{th('label', 'Page')}<th>Section</th>{th('views', 'Views')}{th('visitors', 'Visitors')}{th('spins', 'Spins')}{th('last_date', 'Last visit')}</tr>
            </thead>
            <tbody>
              {pages.map((p) => (
                <tr key={p.path}>
                  <td><div className="an-page"><b>{p.label || p.path}</b><a href={p.path} target="_blank" rel="noreferrer" className="muted small">{p.path}</a></div></td>
                  <td><span className="an-type">{TYPE_LABEL[p.type] || p.type}</span></td>
                  <td className="num">{p.views.toLocaleString()}</td>
                  <td className="num">{p.visitors.toLocaleString()}</td>
                  <td className="num">{p.spins.toLocaleString()}</td>
                  <td className="muted small">{p.last_date ? fmtDay(p.last_date) : '—'}</td>
                </tr>
              ))}
              {data && !pages.length && <tr><td colSpan={6} className="muted">No pages match.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}
