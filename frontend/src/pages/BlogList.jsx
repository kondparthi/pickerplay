import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useApp } from '../store/AppStore'
import { api } from '../lib/api'
import Toolbar from '../components/Toolbar'
import Footer from '../components/Footer'
import AdSlot from '../components/AdSlot'
import Icon from '../components/Icon'
import '../blog.css'

export const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '')

const COVER_COLORS = ['#5546c9', '#29a3e3', '#7cc22c', '#f5a623', '#e5397a', '#00a3a3']
export function Cover({ post, big = false }) {
  if (post.cover_image) return <img className="bl-cover-img" src={post.cover_image} alt="" loading="lazy" />
  const c = COVER_COLORS[(post.id || post.title.length) % COVER_COLORS.length]
  return (
    <div className={`bl-cover-ph ${big ? 'big' : ''}`} style={{ '--c': c }}>
      <span>{post.category || 'Blog'}</span>
    </div>
  )
}

export function PostCard({ post, featured = false }) {
  const { t } = useApp()
  return (
    <Link to={`/blog/${post.slug}`} className={`bl-card card ${featured ? 'bl-featured' : ''}`}>
      <div className="bl-cover"><Cover post={post} big={featured} /></div>
      <div className="bl-card-body">
        <div className="bl-meta-top">
          {post.category && <span className="bl-cat">{post.category}</span>}
          {featured && <span className="bl-flag"><Icon name="star" size={13} /> {t('Featured')}</span>}
        </div>
        <h2>{post.title}</h2>
        <p>{post.excerpt}</p>
        <div className="bl-meta">
          <span>{fmtDate(post.published_at)}</span>
          <span>·</span>
          <span>{post.reading_minutes} {t('min read')}</span>
        </div>
      </div>
    </Link>
  )
}

export default function BlogList() {
  const { t, site } = useApp()
  const [params, setParams] = useSearchParams()
  const q = params.get('q') || ''
  const category = params.get('category') || ''
  const [input, setInput] = useState(q)
  const [state, setState] = useState({ items: [], cats: [], page: 1, last: 1, total: 0, loading: true, error: '' })

  const load = (page = 1) => {
    setState((s) => ({ ...s, loading: true, error: '' }))
    api.get(`/posts?q=${encodeURIComponent(q)}&category=${encodeURIComponent(category)}&page=${page}`)
      .then((r) => setState((s) => ({
        items: page === 1 ? r.data : [...s.items, ...r.data],
        cats: r.categories || s.cats, page: r.current_page, last: r.last_page, total: r.total, loading: false, error: '',
      })))
      .catch((e) => setState((s) => ({ ...s, loading: false, error: e.message })))
  }

  useEffect(() => {
    document.title = `${t('Blog')} | ${site.site_name}`
    setInput(q)
    load(1)
  }, [q, category]) // eslint-disable-line

  const setFilter = (next) => {
    const p = {}
    if (next.q ?? q) p.q = next.q ?? q
    if (next.category ?? category) p.category = next.category ?? category
    setParams(p)
  }

  const showFeatured = !q && !category && state.items.length > 0
  const [first, ...rest] = state.items

  return (
    <div className="app">
      <Toolbar />
      <main className="bl-main">
        <section className="bl-hero app-bg">
          <div className="bl-hero-inner">
            <h1>{site.site_name} {t('Blog')}</h1>
            <p>{t('Ideas, guides and tips for random pickers, spinning wheels and team generators – in class, at work, at parties and on stream.')}</p>
            <form className="bl-search" onSubmit={(e) => { e.preventDefault(); setFilter({ q: input.trim() }) }}>
              <Icon name="search" />
              <input className="input" placeholder={t('Search articles')} value={input} onChange={(e) => setInput(e.target.value)} />
              <button className="btn btn-primary">{t('Search')}</button>
            </form>
            {state.cats.length > 0 && (
              <div className="bl-cats">
                <button className={`bl-chip ${!category ? 'active' : ''}`} onClick={() => setParams(q ? { q } : {})}>{t('All')}</button>
                {state.cats.map((c) => (
                  <button key={c.category} className={`bl-chip ${category === c.category ? 'active' : ''}`} onClick={() => setFilter({ category: c.category })}>
                    {c.category} <span>{c.total}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="bl-wrap">
          {state.error && <div className="alert error">{state.error}</div>}
          {(q || category) && !state.loading && (
            <p className="muted">{state.total} {t('articles')}{q ? ` · “${q}”` : ''}{category ? ` · ${category}` : ''} · <button className="linkish" onClick={() => setParams({})}>{t('Clear filters')}</button></p>
          )}
          {showFeatured && <PostCard post={first} featured />}
          <AdSlot place="blog_list" />
          <div className="bl-grid">
            {(showFeatured ? rest : state.items).map((p) => <PostCard key={p.id} post={p} />)}
          </div>
          {!state.loading && !state.items.length && !state.error && (
            <div className="card center pad-lg">
              <Icon name="file" size={40} />
              <p>{t('No articles found.')}</p>
            </div>
          )}
          {state.loading && <div className="page-loading">{t('Loading…')}</div>}
          {!state.loading && state.page < state.last && (
            <div className="center pad"><button className="btn btn-soft" onClick={() => load(state.page + 1)}>{t('Load more')}</button></div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  )
}
