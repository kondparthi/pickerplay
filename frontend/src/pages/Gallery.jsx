import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useApp } from '../store/AppStore'
import { api } from '../lib/api'
import { wheelFromConfig } from '../lib/defaults'
import { renderStatic } from '../lib/wheelRender'
import SimpleLayout from './SimpleLayout'
import Icon from '../components/Icon'

function timeAgo(iso, t) {
  const d = (Date.now() - new Date(iso).getTime()) / 1000
  if (d < 3600) return t('Created recently')
  if (d < 86400) return `${t('Created')} ${Math.floor(d / 3600)} ${t('hours ago')}`
  if (d < 86400 * 30) return `${t('Created')} ${Math.floor(d / 86400)} ${t('days ago')}`
  if (d < 86400 * 365) return `${t('Created')} ${Math.floor(d / (86400 * 30))} ${t('months ago')}`
  return t('Created last year')
}

function Thumb({ config }) {
  const { site } = useApp()
  const ref = useRef(null)
  const box = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        const size = Math.min(320, box.current?.clientWidth || 280)
        renderStatic(el, wheelFromConfig(config, site), size, -Math.PI / 2 + 0.25)
        io.disconnect()
      }
    })
    io.observe(el)
    return () => io.disconnect()
  }, [config, site])
  return (
    <div ref={box} className="thumb-box">
      <canvas ref={ref} />
    </div>
  )
}

export default function Gallery() {
  const { site, t } = useApp()
  const [params, setParams] = useSearchParams()
  const q = params.get('q') || ''
  const sort = params.get('sort') || 'popular'
  const [input, setInput] = useState(q)
  const [data, setData] = useState({ items: [], total: 0, page: 1, last: 1, loading: true, error: '' })

  const load = (page = 1) => {
    setData((d) => ({ ...d, loading: true, error: '' }))
    api.get(`/gallery?q=${encodeURIComponent(q)}&sort=${sort}&page=${page}`)
      .then((r) => setData((d) => ({
        items: page === 1 ? r.data : [...d.items, ...r.data],
        total: r.total, page: r.current_page, last: r.last_page, loading: false, error: '',
      })))
      .catch((e) => setData((d) => ({ ...d, loading: false, error: e.message })))
  }

  useEffect(() => {
    document.title = `${t('Gallery')} | ${site.site_name}`
    setInput(q)
    load(1)
  }, [q, sort]) // eslint-disable-line

  const tags = (site.gallery_tags || '').split(',').map((s) => s.trim()).filter(Boolean)
  const search = (term) => setParams(term ? { q: term, sort } : { sort })

  return (
    <SimpleLayout className="gallery-page">
      <form className="gallery-search" onSubmit={(e) => { e.preventDefault(); search(input.trim()) }}>
        <div className="search-input">
          <Icon name="search" />
          <input className="input" placeholder={t('Search wheels')} value={input} onChange={(e) => setInput(e.target.value)} />
        </div>
        <button className="btn btn-primary">{t('Search')}</button>
        <select className="input select sm" value={sort} onChange={(e) => setParams(q ? { q, sort: e.target.value } : { sort: e.target.value })}>
          <option value="popular">{t('Most popular')}</option>
          <option value="new">{t('Newest')}</option>
          <option value="featured">{t('Featured')}</option>
        </select>
      </form>
      <div className="tag-row">
        {tags.map((tag) => (
          <button key={tag} className={`tag ${q === tag ? 'active' : ''}`} onClick={() => search(tag)}>{tag}</button>
        ))}
      </div>
      <p className="muted">{t('You can add your own wheels to this gallery by clicking "Share" on the main page.')}</p>
      {data.error && <div className="alert error">{data.error}</div>}
      {!data.loading || data.items.length ? <p>{data.total} {t('wheels were found.')}</p> : null}
      <div className="gallery-grid">
        {data.items.map((w) => (
          <Link key={w.code} to={`/${w.code}`} className="gallery-card card">
            <div className="gc-head">
              <h3>{w.title || w.code}</h3>
              <div className="gc-meta">
                <span>{w.views.toLocaleString()} {t('views')}</span>
                <span>{timeAgo(w.created_at, t)}</span>
              </div>
            </div>
            {w.is_featured && <span className="gc-badge"><Icon name="star" size={14} /> {t('Featured')}</span>}
            <Thumb config={w.config} />
          </Link>
        ))}
      </div>
      {data.loading && <div className="page-loading">{t('Loading…')}</div>}
      {!data.loading && data.page < data.last && (
        <div className="center pad">
          <button className="btn btn-soft" onClick={() => load(data.page + 1)}>{t('Load more')}</button>
        </div>
      )}
    </SimpleLayout>
  )
}
