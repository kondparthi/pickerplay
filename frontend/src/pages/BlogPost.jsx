import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useApp } from '../store/AppStore'
import { api } from '../lib/api'
import Toolbar from '../components/Toolbar'
import Footer from '../components/Footer'
import Icon from '../components/Icon'
import NotFound from './NotFound'
import { Cover, PostCard, fmtDate } from './BlogList'
import '../blog.css'

export default function BlogPost() {
  const { slug } = useParams()
  const { t, site, toast } = useApp()
  const [state, setState] = useState({ post: undefined, related: [] })

  useEffect(() => {
    setState({ post: undefined, related: [] })
    api.get(`/posts/${slug}`)
      .then((r) => {
        setState({ post: r.data, related: r.related || [] })
        document.title = `${r.data.meta_title || r.data.title} | ${site.site_name}`
        window.scrollTo(0, 0)
      })
      .catch(() => setState({ post: null, related: [] }))
  }, [slug, site.site_name])

  const { post, related } = state
  if (post === null) return <NotFound message={t('This article does not exist.')} />

  const url = typeof window !== 'undefined' ? window.location.href : ''
  const share = (net) => {
    const u = encodeURIComponent(url)
    const txt = encodeURIComponent(post.title)
    const links = {
      whatsapp: `https://wa.me/?text=${txt}%20${u}`,
      x: `https://twitter.com/intent/tweet?url=${u}&text=${txt}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`,
    }
    window.open(links[net], '_blank', 'noopener,width=640,height=560')
  }

  return (
    <div className="app">
      <Toolbar />
      <main className="bl-main">
        {post === undefined ? <div className="page-loading">{t('Loading…')}</div> : (
          <>
            <header className="bp-head app-bg">
              <div className="bp-head-inner">
                <nav className="bp-crumbs">
                  <Link to="/blog">{t('Blog')}</Link>
                  {post.category && <><span>/</span><Link to={`/blog?category=${encodeURIComponent(post.category)}`}>{post.category}</Link></>}
                </nav>
                <h1>{post.title}</h1>
                {post.excerpt && <p className="bp-lead">{post.excerpt}</p>}
                <div className="bl-meta">
                  {post.author && <><span><Icon name="user" size={14} /> {post.author}</span><span>·</span></>}
                  <span>{fmtDate(post.published_at)}</span><span>·</span>
                  <span>{post.reading_minutes} {t('min read')}</span>
                </div>
              </div>
            </header>

            <div className="bp-layout">
              <article className="bp-article card">
                <div className="bp-cover"><Cover post={post} big /></div>
                <div className="bp-content prose" dangerouslySetInnerHTML={{ __html: post.content || '' }} />
                {post.tags?.length > 0 && (
                  <div className="bp-tags">
                    {post.tags.map((tag) => <Link key={tag} to={`/blog?q=${encodeURIComponent(tag)}`} className="bl-chip">#{tag}</Link>)}
                  </div>
                )}
                <div className="bp-share">
                  <span>{t('Share')}:</span>
                  <button className="chip-btn" onClick={() => share('whatsapp')}>WhatsApp</button>
                  <button className="chip-btn" onClick={() => share('x')}>X</button>
                  <button className="chip-btn" onClick={() => share('facebook')}>Facebook</button>
                  <button className="chip-btn" onClick={() => share('linkedin')}>LinkedIn</button>
                  <button className="chip-btn" onClick={() => navigator.clipboard?.writeText(url).then(() => toast(t('Copied to clipboard')))}><Icon name="copy" size={14} /> {t('Copy link')}</button>
                </div>
              </article>

              <aside className="bp-side">
                <div className="card bp-cta">
                  <div className="bp-cta-emoji">🎡</div>
                  <h3>{t('Try the wheel spinner')}</h3>
                  <p className="muted">{t('Pick a random name, winner or decision in one spin. Free, fair and no sign-up.')}</p>
                  <Link to="/" className="btn btn-primary">{t('Spin the wheel')}</Link>
                  <Link to="/team-picker" className="btn btn-soft">👥 {t('Team Picker')}</Link>
                </div>
              </aside>
            </div>

            {related.length > 0 && (
              <section className="bl-wrap">
                <h2 className="bl-section-title">{t('Related articles')}</h2>
                <div className="bl-grid">{related.map((p) => <PostCard key={p.id} post={p} />)}</div>
              </section>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  )
}
