import { useState } from 'react'
import { api } from '../../lib/api'
import { PageHead, Pager, useResource, fmtDate } from './common'
import Icon from '../../components/Icon'

const TYPES = { feedback: 'Feedback', idea: 'Idea', bug: 'Bug', ad_report: 'Ad report', wheel_report: 'Wheel report' }

export default function FeedbackPage() {
  const [type, setType] = useState('')
  const [unread, setUnread] = useState(false)
  const [page, setPage] = useState(1)
  const [{ data, meta, error }, reload] = useResource(`/admin/feedback?type=${type}&unread=${unread ? 1 : ''}&page=${page}`)
  return (
    <>
      <PageHead title="Feedback">
        <select className="input select sm" value={type} onChange={(e) => { setType(e.target.value); setPage(1) }}>
          <option value="">All types</option>
          {Object.entries(TYPES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
        <label className="check"><input type="checkbox" checked={unread} onChange={(e) => setUnread(e.target.checked)} /> Unread only</label>
      </PageHead>
      {error && <div className="alert error">{error}</div>}
      <div className="fb-list">
        {(data || []).map((f) => (
          <article key={f.id} className={`card fb-item ${f.is_read ? '' : 'unread'}`}>
            <div className="fb-head">
              <span className="tag">{TYPES[f.type] || f.type}</span>
              <strong>{f.name || 'Anonymous'}</strong>
              {f.email && <a href={`mailto:${f.email}`}>{f.email}</a>}
              <span className="muted small push-right">{fmtDate(f.created_at)}</span>
            </div>
            <p className="fb-msg">{f.message}</p>
            {f.page_url && <div className="muted small ellipsis">Page: {f.page_url}</div>}
            <div className="row">
              <button className="btn btn-soft small" onClick={async () => { await api.patch(`/admin/feedback/${f.id}`, { is_read: !f.is_read }); reload() }}>
                <Icon name="check" size={15} /> {f.is_read ? 'Mark unread' : 'Mark read'}
              </button>
              <button className="btn btn-text small danger" onClick={async () => { if (window.confirm('Delete this message?')) { await api.del(`/admin/feedback/${f.id}`); reload() } }}>
                <Icon name="trash" size={15} /> Delete
              </button>
            </div>
          </article>
        ))}
        {data && !data.length && <p className="muted">No messages.</p>}
      </div>
      <Pager meta={meta} page={page} setPage={setPage} />
    </>
  )
}
