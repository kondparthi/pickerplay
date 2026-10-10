import { useState } from 'react'
import { useApp } from '../../store/AppStore'
import { api } from '../../lib/api'
import { PageHead, Pager, useResource, fmtDate } from './common'
import Icon from '../../components/Icon'

export default function UsersPage() {
  const { user: me } = useApp()
  const [q, setQ] = useState('')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [adding, setAdding] = useState(false)
  const [nu, setNu] = useState({ name: '', email: '', password: '', is_admin: false })
  const [msg, setMsg] = useState('')
  const [{ data, meta, error }, reload] = useResource(`/admin/users?q=${encodeURIComponent(query)}&page=${page}`)

  const act = async (fn) => {
    setMsg('')
    try {
      await fn()
      reload()
    } catch (e) {
      setMsg(e.message)
    }
  }

  return (
    <>
      <PageHead title="Users">
        <form className="row" onSubmit={(e) => { e.preventDefault(); setPage(1); setQuery(q) }}>
          <input className="input" placeholder="Search name or email" value={q} onChange={(e) => setQ(e.target.value)} />
          <button className="btn btn-soft">Search</button>
        </form>
        <button className="btn btn-primary" onClick={() => setAdding((a) => !a)}><Icon name="plus" size={16} /> Add user</button>
      </PageHead>
      {(msg || error) && <div className="alert error">{msg || error}</div>}
      {adding && (
        <form className="card row wrap" onSubmit={(e) => { e.preventDefault(); act(async () => { await api.post('/admin/users', nu); setAdding(false); setNu({ name: '', email: '', password: '', is_admin: false }) }) }}>
          <input className="input" placeholder="Name" required value={nu.name} onChange={(e) => setNu({ ...nu, name: e.target.value })} />
          <input className="input" type="email" placeholder="Email" required value={nu.email} onChange={(e) => setNu({ ...nu, email: e.target.value })} />
          <input className="input" type="password" placeholder="Password (min 8)" minLength={8} required value={nu.password} onChange={(e) => setNu({ ...nu, password: e.target.value })} />
          <label className="check"><input type="checkbox" checked={nu.is_admin} onChange={(e) => setNu({ ...nu, is_admin: e.target.checked })} /> Administrator</label>
          <button className="btn btn-primary">Create</button>
        </form>
      )}
      <div className="card table-wrap">
        <table className="table">
          <thead><tr><th>User</th><th>Wheels</th><th>Joined</th><th>Last login</th><th>Admin</th><th>Active</th><th /></tr></thead>
          <tbody>
            {(data || []).map((u) => (
              <tr key={u.id}>
                <td><strong>{u.name}</strong><div className="muted small">{u.email}</div></td>
                <td>{u.wheels_count}</td>
                <td className="small">{fmtDate(u.created_at)}</td>
                <td className="small">{fmtDate(u.last_login_at)}</td>
                <td><input type="checkbox" className="toggle" checked={u.is_admin} disabled={u.id === me.id} onChange={(e) => act(() => api.patch(`/admin/users/${u.id}`, { is_admin: e.target.checked }))} /></td>
                <td><input type="checkbox" className="toggle" checked={u.is_active} disabled={u.id === me.id} onChange={(e) => act(() => api.patch(`/admin/users/${u.id}`, { is_active: e.target.checked }))} /></td>
                <td className="right nowrap">
                  <button className="icon-btn" title="Set password" onClick={() => { const p = window.prompt(`New password for ${u.email} (min 8 chars)`); if (p) act(() => api.patch(`/admin/users/${u.id}`, { password: p })) }}><Icon name="key" size={17} /></button>
                  {u.id !== me.id && <button className="icon-btn" title="Delete" onClick={() => window.confirm(`Delete ${u.email}?`) && act(() => api.del(`/admin/users/${u.id}`))}><Icon name="trash" size={17} /></button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pager meta={meta} page={page} setPage={setPage} />
    </>
  )
}
