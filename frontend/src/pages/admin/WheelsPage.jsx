import { useState } from 'react'
import { api } from '../../lib/api'
import { PageHead, Pager, useResource, fmtDate } from './common'
import Icon from '../../components/Icon'

export default function WheelsPage() {
  const [filter, setFilter] = useState('shared')
  const [q, setQ] = useState('')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState('created')
  const [{ data, meta, loading, error }, reload] = useResource(`/admin/wheels?filter=${filter}&q=${encodeURIComponent(query)}&page=${page}&sort=${sort}`)

  const patch = async (id, body) => {
    await api.patch(`/admin/wheels/${id}`, body)
    reload()
  }
  const remove = async (w) => {
    if (!window.confirm(`Delete "${w.title || w.share_code}"? This cannot be undone.`)) return
    await api.del(`/admin/wheels/${w.id}`)
    reload()
  }

  return (
    <>
      <PageHead title="Wheels">
        <form className="row" onSubmit={(e) => { e.preventDefault(); setPage(1); setQuery(q) }}>
          <input className="input" placeholder="Search title, code or entries" value={q} onChange={(e) => setQ(e.target.value)} />
          <button className="btn btn-soft">Search</button>
        </form>
      </PageHead>
      <div className="tabs tabs-left">
        {[['shared', 'Share links'], ['public', 'Public gallery'], ['featured', 'Featured'], ['saved', 'Saved in accounts'], ['', 'All']].map(([k, l]) => (
          <button key={k} className={`tab ${filter === k ? 'active' : ''}`} onClick={() => { setFilter(k); setPage(1) }}>{l}</button>
        ))}
        <select className="input select sm push-right" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="created">Newest</option>
          <option value="views">Most viewed</option>
        </select>
      </div>
      {error && <div className="alert error">{error}</div>}
      <div className="card table-wrap">
        <table className="table">
          <thead><tr><th>Wheel</th><th>Owner</th><th>Visibility</th><th>Views</th><th>Created</th><th /></tr></thead>
          <tbody>
            {(data || []).map((w) => (
              <tr key={w.id}>
                <td>
                  <strong>{w.title || '(untitled)'}</strong>
                  {w.share_code && <> · <a href={`/${w.share_code}`} target="_blank" rel="noreferrer" className="mono">{w.share_code}</a></>}
                  <div className="muted small ellipsis" style={{ maxWidth: 360 }}>{w.entries_count} entries: {w.entries_preview}</div>
                </td>
                <td className="small">{w.user ? w.user.email : <span className="muted">anonymous</span>}</td>
                <td>
                  {w.kind === 'shared' ? (
                    <select className="input select sm" value={w.visibility} onChange={(e) => patch(w.id, { visibility: e.target.value })}>
                      <option value="link_spin">Spin only</option>
                      <option value="link_copy">Spin & copy</option>
                      <option value="public">Public gallery</option>
                    </select>
                  ) : <span className="muted">saved</span>}
                </td>
                <td>{w.views}</td>
                <td className="small">{fmtDate(w.created_at)}</td>
                <td className="right nowrap">
                  {w.kind === 'shared' && (
                    <button className="icon-btn" title={w.is_featured ? 'Unfeature' : 'Feature in gallery'} onClick={() => patch(w.id, { is_featured: !w.is_featured })}>
                      <Icon name={w.is_featured ? 'star' : 'staroff'} size={17} style={{ color: w.is_featured ? '#f5a623' : undefined }} />
                    </button>
                  )}
                  <button className="icon-btn" title="Delete" onClick={() => remove(w)}><Icon name="trash" size={17} /></button>
                </td>
              </tr>
            ))}
            {!loading && !(data || []).length && <tr><td colSpan="6" className="muted center">No wheels found.</td></tr>}
          </tbody>
        </table>
      </div>
      <Pager meta={meta} page={page} setPage={setPage} />
    </>
  )
}
