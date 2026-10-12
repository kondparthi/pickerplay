import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Facebook, Linkedin, Twitter, MessageCircle, Link2, Clock, CalendarDays, ArrowUp } from 'lucide-react'
import { useApp } from '../store/AppStore'
import { api } from '../lib/api'
import { normalizeHtml, slugifyText } from '../lib/content'
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
  const [progress, setProgress] = useState(0)
  const [activeId, setActiveId] = useState('')
  const bodyRef = useRef(null)

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

  // headings get ids for the table of contents; external links open in a new tab
  const { html, toc } = useMemo(() => {
    if (!post) return { html: '', toc: [] }
    const doc = new DOMParser().parseFromString(`<div>${normalizeHtml(post.content)}</div>`, 'text/html')
    const root = doc.body.firstChild
    const list = []
    root.querySelectorAll('h2, h3').forEach((h, i) => {
      const id = `${slugifyText(h.textContent) || 'section'}-${i}`
      h.id = id
      list.push({ id, text: h.textContent.trim(), level: h.tagName === 'H3' ? 3 : 2 })
    })
    root.querySelectorAll('a[href^="http"]').forEach((a) => { a.target = '_blank'; a.rel = 'noopener' })
    root.querySelectorAll('img').forEach((img) => img.setAttribute('loading', 'lazy'))
    return { html: root.innerHTML, toc: list }
  }, [post])

  // reading progress + active TOC entry
  useEffect(() => {
    if (!post) return
    const onScroll = () => {
      const el = bodyRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const total = r.height - window.innerHeight * 0.6
      setProgress(Math.max(0, Math.min(100, ((-r.top + 120) / Math.max(1, total)) * 100)))
      let cur = ''
      for (const item of toc) {
        const h = document.getElementById(item.id)
        if (h && h.getBoundingClientRect().top < 140) cur = item.id
      }
      setActiveId(cur)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [post, toc])

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
  const copy = () => navigator.clipboard?.writeText(url).then(() => toast(t('Copied to clipboard')))
  const shareBtns = [
    ['whatsapp', <MessageCircle key="w" size={18} />, 'WhatsApp'],
    ['x', <Twitter key="x" size={18} />, 'X'],
    ['facebook', <Facebook key="f" size={18} />, 'Facebook'],
    ['linkedin', <Linkedin key="l" size={18} />, 'LinkedIn'],
  ]
  const goTo = (id) => {
    const el = document.getElementById(id)
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 90, behavior: 'smooth' })
  }
  const initials = (post?.author || site.site_name).split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="app">
      <Toolbar />
      {post && <div className="bp-progress" style={{ width: `${progress}%` }} />}
      <main className="bl-main bp-page">
        {post === undefined ? <div className="page-loading">{t('Loading…')}</div> : (
          <>
            <header className="bp-hero">
              <div className="bp-hero-inner">
                <nav className="bp-crumbs">
                  <Link to="/">{t('Home')}</Link><span>/</span>
                  <Link to="/blog">{t('Blog')}</Link>
                  {post.category && <><span>/</span><Link to={`/blog?category=${encodeURIComponent(post.category)}`}>{post.category}</Link></>}
                </nav>
                {post.category && <Link to={`/blog?category=${encodeURIComponent(post.category)}`} className="bp-cat">{post.category}</Link>}
                <h1>{post.title}</h1>
                {post.excerpt && <p className="bp-lead">{post.excerpt}</p>}
                <div className="bp-byline">
                  <span className="bp-avatar">{initials}</span>
                  <div>
                    <b>{post.author || site.site_name}</b>
                    <span className="bp-meta">
                      <CalendarDays size={14} /> {fmtDate(post.published_at)}
                      <i>•</i>
                      <Clock size={14} /> {post.reading_minutes} {t('min read')}
                    </span>
                  </div>
                </div>
              </div>
            </header>

            <div className="bp-cover-wrap">
              <div className="bp-cover-xl"><Cover post={post} big /></div>
            </div>

            <div className="bp-grid">
              <aside className="bp-rail" aria-label={t('Share')}>
                <span>{t('Share')}</span>
                {shareBtns.map(([k, icon, label]) => (
                  <button key={k} className="bp-round" onClick={() => share(k)} title={label} aria-label={label}>{icon}</button>
                ))}
                <button className="bp-round" onClick={copy} title={t('Copy link')} aria-label={t('Copy link')}><Link2 size={18} /></button>
              </aside>

              <article className="bp-body" ref={bodyRef}>
                {toc.length > 2 && (
                  <details className="bp-toc-mobile">
                    <summary>{t('On this page')} ({toc.length})</summary>
                    <ul>{toc.map((h) => <li key={h.id} className={h.level === 3 ? 'sub' : ''}><button onClick={() => goTo(h.id)}>{h.text}</button></li>)}</ul>
                  </details>
                )}
                <div className="bp-prose" dangerouslySetInnerHTML={{ __html: html }} />

                {post.tags?.length > 0 && (
                  <div className="bp-tags">
                    {post.tags.map((tag) => <Link key={tag} to={`/blog?q=${encodeURIComponent(tag)}`} className="bp-tag">#{tag}</Link>)}
                  </div>
                )}

                <div className="bp-share-box">
                  <div>
                    <b>{t('Enjoyed this article?')}</b>
                    <span>{t('Share it with your friends, class or team.')}</span>
                  </div>
                  <div className="bp-share-btns">
                    {shareBtns.map(([k, icon, label]) => (
                      <button key={k} className={`bp-share-btn s-${k}`} onClick={() => share(k)}>{icon} <span>{label}</span></button>
                    ))}
                    <button className="bp-share-btn s-copy" onClick={copy}><Link2 size={18} /> <span>{t('Copy link')}</span></button>
                  </div>
                </div>

                <div className="bp-author">
                  <span className="bp-avatar lg">{initials}</span>
                  <div>
                    <small>{t('Written by')}</small>
                    <b>{post.author || site.site_name}</b>
                    <p>{t('The team behind')} {site.site_name} – {t('free random pickers, spinning wheels and team generators for classrooms, offices, parties and streams.')}</p>
                  </div>
                </div>
              </article>

              <aside className="bp-aside">
                {toc.length > 0 && (
                  <nav className="bp-toc">
                    <h4>{t('On this page')}</h4>
                    <ul>
                      {toc.map((h) => (
                        <li key={h.id} className={`${h.level === 3 ? 'sub' : ''} ${activeId === h.id ? 'active' : ''}`}>
                          <button onClick={() => goTo(h.id)}>{h.text}</button>
                        </li>
                      ))}
                    </ul>
                    <button className="bp-top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}><ArrowUp size={14} /> {t('Back to top')}</button>
                  </nav>
                )}
                <div className="bp-cta">
                  <div className="bp-cta-wheel"><span /></div>
                  <h3>{t('Try the wheel spinner')}</h3>
                  <p>{t('Pick a random name, winner or decision in one spin. Free, fair and no sign-up.')}</p>
                  <Link to="/" className="bp-cta-btn">🎡 {t('Spin the wheel')}</Link>
                  <Link to="/team-picker" className="bp-cta-btn ghost">👥 {t('Team Picker')}</Link>
                </div>
              </aside>
            </div>

            {related.length > 0 && (
              <section className="bl-wrap bp-related">
                <div className="bp-related-head">
                  <h2 className="bl-section-title">{t('Keep reading')}</h2>
                  <Link to="/blog" className="bp-all">{t('All articles')} <Icon name="arrowright" size={16} /></Link>
                </div>
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
