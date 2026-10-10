import { useState } from 'react'
import { useApp } from '../../store/AppStore'
import { api } from '../../lib/api'
import { wheelToConfig } from '../../lib/defaults'
import { Field, PageHead, Toggle, useResource } from './common'
import Icon from '../../components/Icon'

const EMPTY = { slug: '', name: '', emoji: '🎯', heading: '', meta_title: '', meta_description: '', content: '', is_active: true, show_in_menu: true, sort_order: 100, config: { entries: [], settings: {} } }

export default function ToolsPage() {
  const { activeWheel, setBoot } = useApp()
  const [{ data, error }, reload] = useResource('/admin/tools')
  const [edit, setEdit] = useState(null)
  const [entriesText, setEntriesText] = useState('')
  const [msg, setMsg] = useState('')

  const open = (tool) => {
    setMsg('')
    setEdit({ ...EMPTY, ...tool })
    setEntriesText((tool?.config?.entries || []).map((e) => e.text).join('\n'))
  }
  const set = (k) => (v) => setEdit((x) => ({ ...x, [k]: v?.target ? v.target.value : v }))

  const save = async () => {
    setMsg('')
    const lines = entriesText.split(/\r?\n/).map((s) => s.trim()).filter(Boolean)
    // keep per-entry extras (colors, images, weights) for unchanged lines
    const old = new Map((edit.config?.entries || []).map((e) => [e.text, e]))
    const config = { ...edit.config, title: edit.name, entries: lines.map((t) => old.get(t) || { text: t }) }
    const body = { ...edit, config, sort_order: Number(edit.sort_order) || 0 }
    try {
      if (edit.id) await api.put(`/admin/tools/${edit.id}`, body)
      else await api.post('/admin/tools', body)
      setEdit(null)
      reload()
      api.get('/bootstrap?t=' + Date.now()).then((b) => setBoot((o) => ({ ...o, ...b, loaded: true }))).catch(() => {})
    } catch (e) {
      setMsg(e.message)
    }
  }
  const remove = async (tool) => {
    if (!window.confirm(`Delete the "${tool.name}" page?`)) return
    await api.del(`/admin/tools/${tool.id}`)
    reload()
  }

  if (edit) {
    return (
      <>
        <PageHead title={edit.id ? `Edit: ${edit.name}` : 'New picker tool'}>
          <button className="btn btn-text" onClick={() => setEdit(null)}>Cancel</button>
          <button className="btn btn-primary" onClick={save}>Save</button>
        </PageHead>
        {msg && <div className="alert error">{msg}</div>}
        <div className="card form-grid">
          <Field label="Name"><input className="input" value={edit.name} onChange={set('name')} /></Field>
          <Field label="URL slug" help={`${window.location.origin}/${edit.slug || 'your-slug'}`}><input className="input mono" value={edit.slug} onChange={(e) => set('slug')(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-'))} /></Field>
          <Field label="Emoji / icon"><input className="input sm" value={edit.emoji || ''} onChange={set('emoji')} maxLength={16} /></Field>
          <Field label="Page heading (H1)"><input className="input" value={edit.heading || ''} onChange={set('heading')} /></Field>
          <Field label="SEO title"><input className="input" value={edit.meta_title || ''} onChange={set('meta_title')} maxLength={200} /></Field>
          <Field label="Meta description" help={`${(edit.meta_description || '').length}/300`}><textarea className="input" rows={2} value={edit.meta_description || ''} onChange={set('meta_description')} maxLength={300} /></Field>
          <Field label="Wheel entries (one per line)" wide help="Tip: design the wheel on the main page (colors, sounds, images), then click “Use current wheel”.">
            <textarea className="input mono" rows={10} value={entriesText} onChange={(e) => setEntriesText(e.target.value)} />
            <button type="button" className="btn btn-soft small" onClick={() => {
              const cfg = wheelToConfig(activeWheel)
              setEdit((x) => ({ ...x, config: cfg }))
              setEntriesText(cfg.entries.map((e) => e.text).join('\n'))
            }}><Icon name="dice" size={15} /> Use current wheel (entries + all settings)</button>
          </Field>
          <Field label="SEO content (HTML, shown below the wheel)" wide><textarea className="input mono" rows={12} value={edit.content || ''} onChange={set('content')} /></Field>
          <Field label="Sort order"><input className="input sm" type="number" value={edit.sort_order} onChange={set('sort_order')} /></Field>
          <Toggle checked={edit.is_active} onChange={set('is_active')} label="Active (page is online)" />
          <Toggle checked={edit.show_in_menu} onChange={set('show_in_menu')} label="Show in Pickers menu, home and footer" />
        </div>
      </>
    )
  }

  return (
    <>
      <PageHead title="Picker tools (SEO landing pages)">
        <button className="btn btn-primary" onClick={() => open(null)}><Icon name="plus" size={16} /> New tool</button>
      </PageHead>
      {error && <div className="alert error">{error}</div>}
      <div className="card table-wrap">
        <table className="table">
          <thead><tr><th>Tool</th><th>URL</th><th>Entries</th><th>Status</th><th /></tr></thead>
          <tbody>
            {(data || []).map((tool) => (
              <tr key={tool.id}>
                <td>{tool.emoji} <strong>{tool.name}</strong></td>
                <td><a href={`/${tool.slug}`} target="_blank" rel="noreferrer" className="mono">/{tool.slug}</a></td>
                <td>{tool.config?.entries?.length || 0}</td>
                <td>{tool.is_active ? 'Active' : <span className="muted">Hidden</span>}{tool.show_in_menu ? '' : ' · not in menu'}</td>
                <td className="right nowrap">
                  <button className="icon-btn" onClick={() => open(tool)} title="Edit"><Icon name="pencil" size={17} /></button>
                  <button className="icon-btn" onClick={() => remove(tool)} title="Delete"><Icon name="trash" size={17} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
