import { useState } from 'react'
import { PageHead, Pager, useResource, fmtDate } from './common'

export default function ActivityPage() {
  const [page, setPage] = useState(1)
  const [{ data, meta, error }] = useResource(`/admin/audit-logs?page=${page}`)
  return (
    <>
      <PageHead title="Activity log" />
      {error && <div className="alert error">{error}</div>}
      <div className="card table-wrap">
        <table className="table">
          <thead><tr><th>When</th><th>User</th><th>Action</th><th>Details</th><th>IP</th></tr></thead>
          <tbody>
            {(data || []).map((a) => (
              <tr key={a.id}>
                <td className="small nowrap">{fmtDate(a.created_at)}</td>
                <td className="small">{a.user?.email || '—'}</td>
                <td className="mono small">{a.action}</td>
                <td className="muted small ellipsis" style={{ maxWidth: 380 }}>{a.metadata ? JSON.stringify(a.metadata) : ''}</td>
                <td className="small mono">{a.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pager meta={meta} page={page} setPage={setPage} />
    </>
  )
}
