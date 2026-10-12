import { useEffect, useRef, useState } from 'react'
import { api, uploadImage } from '../../lib/api'
import { Field, PageHead, Pager, Toggle, useResource, fmtDate } from './common'
import Icon from '../../components/Icon'
import RichEditor from '../../components/RichEditor'

const EMPTY = { title: '', slug: '', excerpt: '', content: '', cover_image: '', category: '', tags: '', meta_title: '', meta_description: '', status: 'draft', published_at: '', is_featured: false }
const slugify = (s) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120)
const toLocalInput = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

/* ---------------- editor ---------------- */
function PostEditor({ initial, categories, onClose, onSaved }) {
  const [p, setP] = useState({ ...EMPTY, ...initial, published_at: toLocalInput(initial?.published_at) })
  const [slugTouched, setSlugTouched] = useState(!!initial?.id)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState({ type: '', text: '' })
  const coverInput = useRef(null)
  const set = (k) => (v) => setP((x) => ({ ...x, [k]: v?.target ? v.target.value : v }))

  const uploadCover = async (file) => {
    if (!file) return
    try {
      setP((x) => ({ ...x, cover_image: '' }))
      const url = await uploadImage(file)
      setP((x) => ({ ...x, cover_image: url }))
    } catch (e) {
      setMsg({ type: 'error', text: e.message })
    }
  }

  const save = async (status) => {
    if (!p.title.trim()) return setMsg({ type: 'error', text: 'Please enter a title.' })
    setBusy(true)
    setMsg({ type: '', text: '' })
    const body = { ...p, status: status || p.status, slug: p.slug || slugify(p.title), published_at: p.published_at ? new Date(p.published_at).toISOString() : null, is_featured: !!p.is_featured }
    try {
      const r = p.id ? await api.put(`/admin/posts/${p.id}`, body) : await api.post('/admin/posts', body)
      setP((x) => ({ ...x, id: r.data.id, slug: r.data.slug, status: r.data.status, published_at: toLocalInput(r.data.published_at) }))
      setSlugTouched(true)
      setMsg({ type: 'success', text: body.status === 'published' ? 'Published.' : 'Draft saved.' })
      onSaved?.()
    } catch (e) {
      setMsg({ type: 'error', text: e.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHead title={p.id ? 'Edit post' : 'New post'}>
        <button className="btn btn-text" onClick={onClose}><Icon name="back" size={16} /> All posts</button>
        {p.id && p.status === 'published' && <a className="btn btn-soft" href={`/blog/${p.slug}`} target="_blank" rel="noreferrer"><Icon name="external" size={16} /> View</a>}
        <button className="btn btn-soft" disabled={busy} onClick={() => save('draft')}>Save draft</button>
        <button className="btn btn-primary" disabled={busy} onClick={() => save('published')}>{p.status === 'published' ? 'Update' : 'Publish'}</button>
      </PageHead>
      {msg.text && <div className={`alert ${msg.type}`}>{msg.text}</div>}

      <div className="pe-layout">
        <div className="pe-main card">
          <input className="input pe-title" placeholder="Post title" value={p.title} onChange={(e) => { set('title')(e); if (!slugTouched) setP((x) => ({ ...x, slug: slugify(e.target.value) })) }} />
          <div className="pe-slug">
            <span className="muted small">{window.location.origin}/blog/</span>
            <input className="input mono sm" value={p.slug} onChange={(e) => { setSlugTouched(true); set('slug')(slugify(e.target.value)) }} />
          </div>
          <Field label="Excerpt (shown on the blog list and under the title)">
            <textarea className="input" rows={2} maxLength={500} value={p.excerpt || ''} onChange={set('excerpt')} />
          </Field>
          <RichEditor value={p.content || ''} onChange={(html) => setP((x) => ({ ...x, content: html }))} onError={(m) => setMsg({ type: 'error', text: m })} />
        </div>

        <aside className="pe-side">
          <div className="card stack">
            <h3>Publish</h3>
            <Field label="Status">
              <select className="input select" value={p.status} onChange={set('status')}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </Field>
            <Field label="Publish date" help="Leave empty to publish now. A future date schedules the post.">
              <input className="input" type="datetime-local" value={p.published_at || ''} onChange={set('published_at')} />
            </Field>
            <Toggle checked={p.is_featured} onChange={set('is_featured')} label="Featured (shown big at the top)" />
          </div>
          <div className="card stack">
            <h3>Cover image</h3>
            <div className="pe-cover" onClick={() => coverInput.current?.click()}>
              {p.cover_image ? <img src={p.cover_image} alt="" /> : <span className="muted"><Icon name="upload" /> Upload 1200×630</span>}
            </div>
            <input ref={coverInput} type="file" accept="image/*" hidden onChange={(e) => { uploadCover(e.target.files?.[0]); e.target.value = '' }} />
            {p.cover_image && <button className="btn btn-text small danger" onClick={() => set('cover_image')('')}>Remove cover</button>}
          </div>
          <div className="card stack">
            <h3>Organise</h3>
            <Field label="Category">
              <input className="input" list="pe-cats" value={p.category || ''} onChange={set('category')} placeholder="e.g. Classroom" />
              <datalist id="pe-cats">{categories.map((c) => <option key={c} value={c} />)}</datalist>
            </Field>
            <Field label="Tags" help="Comma separated"><input className="input" value={p.tags || ''} onChange={set('tags')} /></Field>
          </div>
          <div className="card stack">
            <h3>SEO</h3>
            <Field label="SEO title" help={`${(p.meta_title || p.title).length}/60`}><input className="input" value={p.meta_title || ''} onChange={set('meta_title')} placeholder={p.title} /></Field>
            <Field label="Meta description" help={`${(p.meta_description || '').length}/160`}><textarea className="input" rows={3} maxLength={300} value={p.meta_description || ''} onChange={set('meta_description')} /></Field>
            <div className="pe-serp">
              <div className="pe-serp-title">{p.meta_title || p.title || 'Post title'}</div>
              <div className="pe-serp-url">{window.location.host}/blog/{p.slug || 'post-url'}</div>
              <div className="pe-serp-desc">{p.meta_description || p.excerpt || 'Meta description preview…'}</div>
            </div>
          </div>
        </aside>
      </div>
    </>
  )
}

/* ---------------- list ---------------- */
export default function PostsPage() {
  const [status, setStatus] = useState('')
  const [q, setQ] = useState('')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState(null) // null = list, {} = new, {id} = edit
  const [{ data, meta, error, loading }, reload] = useResource(`/admin/posts?status=${status}&q=${encodeURIComponent(query)}&page=${page}`)
  const categories = meta?.categories || []

  useEffect(() => { window.scrollTo(0, 0) }, [editing])

  const openPost = async (id) => {
    const r = await api.get(`/admin/posts/${id}`)
    setEditing(r.data)
  }
  const remove = async (post) => {
    if (!window.confirm(`Delete "${post.title}"? This cannot be undone.`)) return
    await api.del(`/admin/posts/${post.id}`)
    reload()
  }

  if (editing) return <PostEditor initial={editing} categories={categories} onClose={() => { setEditing(null); reload() }} onSaved={reload} />

  return (
    <>
      <PageHead title="Blog posts">
        <form className="row" onSubmit={(e) => { e.preventDefault(); setPage(1); setQuery(q) }}>
          <input className="input" placeholder="Search posts" value={q} onChange={(e) => setQ(e.target.value)} />
          <button className="btn btn-soft">Search</button>
        </form>
        <button className="btn btn-primary" onClick={() => setEditing({})}><Icon name="plus" size={16} /> New post</button>
      </PageHead>
      <div className="tabs tabs-left">
        {[['', 'All'], ['published', 'Published'], ['draft', 'Drafts']].map(([k, l]) => (
          <button key={k} className={`tab ${status === k ? 'active' : ''}`} onClick={() => { setStatus(k); setPage(1) }}>{l}</button>
        ))}
      </div>
      {error && <div className="alert error">{error}</div>}
      <div className="card table-wrap">
        <table className="table">
          <thead><tr><th style={{ width: 70 }} /><th>Title</th><th>Category</th><th>Status</th><th>Views</th><th>Date</th><th /></tr></thead>
          <tbody>
            {(data || []).map((p) => (
              <tr key={p.id}>
                <td>{p.cover_image ? <img src={p.cover_image} alt="" className="pe-thumb" /> : <span className="pe-thumb pe-thumb-ph"><Icon name="file" size={16} /></span>}</td>
                <td>
                  <button className="linkish pe-title-link" onClick={() => openPost(p.id)}>{p.title}</button>
                  {p.is_featured && <span className="tag" style={{ marginLeft: 8, padding: '1px 8px', fontSize: 11 }}>Featured</span>}
                  <div className="muted small">/blog/{p.slug}</div>
                </td>
                <td>{p.category || '—'}</td>
                <td><span className={`pe-status ${p.status}`}>{p.status === 'published' ? (new Date(p.published_at) > new Date() ? 'Scheduled' : 'Published') : 'Draft'}</span></td>
                <td>{p.views}</td>
                <td className="small">{fmtDate(p.published_at || p.updated_at)}</td>
                <td className="right nowrap">
                  {p.status === 'published' && <a className="icon-btn" href={`/blog/${p.slug}`} target="_blank" rel="noreferrer" title="View"><Icon name="external" size={17} /></a>}
                  <button className="icon-btn" title="Edit" onClick={() => openPost(p.id)}><Icon name="pencil" size={17} /></button>
                  <button className="icon-btn" title="Delete" onClick={() => remove(p)}><Icon name="trash" size={17} /></button>
                </td>
              </tr>
            ))}
            {!loading && !(data || []).length && <tr><td colSpan="7" className="center muted pad">No posts yet. Click “New post” to write your first article.</td></tr>}
          </tbody>
        </table>
      </div>
      <Pager meta={meta} page={page} setPage={setPage} />
    </>
  )
}
