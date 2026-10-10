import { useState } from 'react'
import { useApp } from '../../store/AppStore'
import { api } from '../../lib/api'
import { Field, PageHead, Toggle, useResource } from './common'
import Icon, { ICON_NAMES } from '../../components/Icon'

const EMPTY = { slug: '', title: '', meta_description: '', content: '', icon: 'file', show_in_footer: true, is_published: true, sort_order: 100 }

export default function PagesPage() {
  const { setBoot } = useApp()
  const [{ data, error }, reload] = useResource('/admin/pages')
  const [edit, setEdit] = useState(null)
  const [preview, setPreview] = useState(false)
  const [msg, setMsg] = useState('')
  const set = (k) => (v) => setEdit((x) => ({ ...x, [k]: v?.target ? v.target.value : v }))

  const save = async () => {
    setMsg('')
    try {
      const body = { ...edit, sort_order: Number(edit.sort_order) || 0 }
      if (edit.id) await api.put(`/admin/pages/${edit.id}`, body)
      else await api.post('/admin/pages', body)
      setEdit(null)
      reload()
      api.get('/bootstrap?t=' + Date.now()).then((b) => setBoot((o) => ({ ...o, ...b, loaded: true }))).catch(() => {})
    } catch (e) {
      setMsg(e.message)
    }
  }

  if (edit) {
    return (
      <>
        <PageHead title={edit.id ? `Edit page: ${edit.title}` : 'New page'}>
          <button className="btn btn-text" onClick={() => setEdit(null)}>Cancel</button>
          <button className="btn btn-primary" onClick={save}>Save</button>
        </PageHead>
        {msg && <div className="alert error">{msg}</div>}
        <div className="card form-grid">
          <Field label="Title"><input className="input" value={edit.title} onChange={set('title')} /></Field>
          <Field label="Slug" help={`${window.location.origin}/page/${edit.slug || '…'}`}><input className="input mono" value={edit.slug} onChange={(e) => set('slug')(e.target.value.toLowerCase().replace(/[^a-z0-9_-]+/g, '-'))} /></Field>
          <Field label="Footer icon">
            <div className="row">
              <select className="input select sm" value={edit.icon || 'file'} onChange={set('icon')}>
                {ICON_NAMES.map((n) => <option key={n}>{n}</option>)}
              </select>
              <Icon name={edit.icon || 'file'} />
            </div>
          </Field>
          <Field label="Meta description"><input className="input" value={edit.meta_description || ''} onChange={set('meta_description')} maxLength={300} /></Field>
          <Field label="Content (HTML)" wide>
            <div className="row"><button type="button" className="btn btn-soft small" onClick={() => setPreview((p) => !p)}>{preview ? 'Edit HTML' : 'Preview'}</button></div>
            {preview ? <div className="prose preview-pane" dangerouslySetInnerHTML={{ __html: edit.content || '' }} /> : (
              <textarea className="input mono" rows={18} value={edit.content || ''} onChange={set('content')} />
            )}
          </Field>
          <Field label="Sort order"><input className="input sm" type="number" value={edit.sort_order} onChange={set('sort_order')} /></Field>
          <Toggle checked={edit.is_published} onChange={set('is_published')} label="Published" />
          <Toggle checked={edit.show_in_footer} onChange={set('show_in_footer')} label="Show link in footer" />
        </div>
      </>
    )
  }

  return (
    <>
      <PageHead title="Pages">
        <button className="btn btn-primary" onClick={() => { setPreview(false); setEdit({ ...EMPTY }) }}><Icon name="plus" size={16} /> New page</button>
      </PageHead>
      {error && <div className="alert error">{error}</div>}
      <div className="card table-wrap">
        <table className="table">
          <thead><tr><th>Page</th><th>URL</th><th>Footer</th><th>Status</th><th /></tr></thead>
          <tbody>
            {(data || []).map((p) => (
              <tr key={p.id}>
                <td><Icon name={p.icon || 'file'} size={16} /> <strong>{p.title}</strong></td>
                <td><a href={`/page/${p.slug}`} target="_blank" rel="noreferrer" className="mono">/page/{p.slug}</a></td>
                <td>{p.show_in_footer ? 'Yes' : '—'}</td>
                <td>{p.is_published ? 'Published' : <span className="muted">Draft</span>}</td>
                <td className="right nowrap">
                  <button className="icon-btn" onClick={() => { setPreview(false); setEdit({ ...p }) }} title="Edit"><Icon name="pencil" size={17} /></button>
                  <button className="icon-btn" title="Delete" onClick={async () => { if (window.confirm(`Delete page "${p.title}"?`)) { await api.del(`/admin/pages/${p.id}`); reload() } }}><Icon name="trash" size={17} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
