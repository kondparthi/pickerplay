import { Fragment, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../store/AppStore'
import AdSlot from './AdSlot'
import '../content.css'
import ToolIcon from './ToolIcon'

/**
 * Renders a picker page's HTML content in the site theme:
 * everything before the first <h2> becomes the centred intro,
 * every <h2> section becomes its own card.
 */
export default function ToolContent({ html, heading, currentSlug }) {
  const { site, boot, t } = useApp()

  const { intro, sections } = useMemo(() => {
    const doc = new DOMParser().parseFromString(`<div>${html || ''}</div>`, 'text/html')
    const root = doc.body.firstChild
    const introNodes = []
    const secs = []
    let cur = null
    for (const node of Array.from(root.childNodes)) {
      if (node.nodeType === 1 && node.tagName === 'H2') {
        cur = { title: node.textContent, nodes: [] }
        secs.push(cur)
      } else if (cur) cur.nodes.push(node)
      else introNodes.push(node)
    }
    const toHtml = (nodes) => nodes.map((n) => (n.nodeType === 1 ? n.outerHTML : n.textContent)).join('').trim()
    return { intro: toHtml(introNodes), sections: secs.map((s) => ({ title: s.title, html: toHtml(s.nodes) })) }
  }, [html])

  const tools = (boot.tools || []).filter((x) => x.slug !== currentSlug)

  return (
    <div className="pc-wrap">
      {(heading || intro) && (
        <section className="pc-intro">
          {heading && <h2>{heading}</h2>}
          {intro && <div className="pc-intro-body" dangerouslySetInnerHTML={{ __html: intro }} />}
        </section>
      )}
      <section className="info-grid pc-grid">
        {sections.map((s, i) => (
          <Fragment key={i}>
          {i === 2 && <AdSlot place="tool" className="grid-ad" />}
          <article className="info-card card pc-card">
            <h2>
              {site.favicon_url && <img src={site.favicon_url} alt="" className="info-icon" />}
              {s.title}
            </h2>
            <div className="pc-body" dangerouslySetInnerHTML={{ __html: s.html }} />
          </article>
          </Fragment>
        ))}
        {sections.length < 2 && <AdSlot place="tool" className="grid-ad" />}
        <article className="info-card card pc-card">
          <h2>
            {site.favicon_url && <img src={site.favicon_url} alt="" className="info-icon" />}
            {t('More pickers')}
          </h2>
          <div className="tool-chips">
            <Link to="/" className="tool-chip"><span>🎡</span> {t('Wheel spinner')}</Link>
            <Link to="/team-picker" className="tool-chip"><span>👥</span> {t('Team Picker')}</Link>
            {tools.map((tool) => (
              <Link key={tool.slug} to={`/${tool.slug}`} className="tool-chip"><span><ToolIcon icon={tool.emoji} /></span> {tool.name}</Link>
            ))}
          </div>
        </article>
      </section>
    </div>
  )
}
