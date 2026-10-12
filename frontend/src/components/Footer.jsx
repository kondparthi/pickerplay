import { Link } from 'react-router-dom'
import { useApp } from '../store/AppStore'
import Icon from './Icon'

export default function Footer() {
  const { boot, site, openDialog, t } = useApp()
  const pages = boot.pages || []
  const tools = boot.tools || []
  return (
    <footer className="footer">
      {tools.length > 0 && (
        <div className="footer-tools">
          {tools.map((tool) => (
            <Link key={tool.slug} to={`/${tool.slug}`}>
              {tool.emoji} {tool.name}
            </Link>
          ))}
        </div>
      )}
      <div className="footer-links">
        {pages.map((p) => (
          <Link key={p.slug} to={p.slug === 'blog' ? '/blog' : `/page/${p.slug}`}>
            <Icon name={p.icon || 'file'} size={16} /> <span>{t(p.title)}</span>
          </Link>
        ))}
        <button className="linkish" onClick={() => openDialog('feedback')}>
          <Icon name="feedback" size={16} /> <span>{t('Feedback')}</span>
        </button>
      </div>
      <div className="footer-meta">
        <span>{site.copyright}</span>
        {site.contact_email && <a href={`mailto:${site.contact_email}`}>{site.contact_email}</a>}
      </div>
    </footer>
  )
}
