import { useCallback, useEffect, useState } from 'react'
import { api } from '../../lib/api'

export function useResource(url, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: '', meta: {} })
  const reload = useCallback(() => {
    setState((s) => ({ ...s, loading: true }))
    api.get(url)
      .then((r) => setState({ data: r.data ?? r, loading: false, error: '', meta: r }))
      .catch((e) => setState({ data: null, loading: false, error: e.message, meta: {} }))
  }, [url])
  useEffect(reload, [reload, ...deps]) // eslint-disable-line
  return [state, reload, setState]
}

export function PageHead({ title, children }) {
  return (
    <div className="admin-head">
      <h1>{title}</h1>
      <div className="row">{children}</div>
    </div>
  )
}

export function Pager({ meta, page, setPage }) {
  if (!meta || !meta.last_page || meta.last_page <= 1) return null
  return (
    <div className="pager">
      <button className="btn btn-soft small" disabled={page <= 1} onClick={() => setPage(page - 1)}>‹ Prev</button>
      <span className="muted">Page {meta.current_page} of {meta.last_page} · {meta.total} total</span>
      <button className="btn btn-soft small" disabled={page >= meta.last_page} onClick={() => setPage(page + 1)}>Next ›</button>
    </div>
  )
}

export function Field({ label, help, children, wide }) {
  return (
    <label className={`field ${wide ? 'field-wide' : ''}`}>
      <span className="field-label">{label}</span>
      {children}
      {help && <span className="field-help">{help}</span>}
    </label>
  )
}

export function Toggle({ checked, onChange, label }) {
  return (
    <label className="toggle-row">
      <input type="checkbox" className="toggle" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  )
}

export const fmtDate = (s) => (s ? new Date(s).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—')
