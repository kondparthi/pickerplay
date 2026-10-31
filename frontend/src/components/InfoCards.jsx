import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../store/AppStore'
import { api } from '../lib/api'
import Odometer from './Odometer'
import AdSlot from './AdSlot'
import ToolIcon from './ToolIcon'

function Card({ title, children }) {
  const { site } = useApp()
  return (
    <article className="info-card card">
      <h2>
        {site.favicon_url && <img src={site.favicon_url} alt="" className="info-icon" width="30" height="30" loading="lazy" decoding="async" />}
        {title}
      </h2>
      {children}
    </article>
  )
}

export default function InfoCards() {
  const { site, t, openDialog, boot } = useApp()
  const [stats, setStats] = useState(null)
  const name = site.site_name
  const showStats = site.show_stats === '1'

  useEffect(() => {
    if (!showStats) return
    let alive = true
    const load = () => api.get('/stats').then((s) => alive && setStats(s)).catch(() => {})
    load()
    const id = setInterval(load, 30000)
    return () => {
      alive = false
      clearInterval(id)
    }
  }, [showStats])

  if (site.show_info_cards !== '1') return null
  const tools = boot.tools || []

  return (
    <section className="info-grid">
      <Card title={t('What is the wheel spinner for?')}>
        <p>{t('People find new uses for the wheel every day. A few favourites:')}</p>
        <ul>
          <li>{t('Teachers: pick which student answers next, forms groups or chooses the next topic.')}</li>
          <li>{t('Shops and brands: draw the winner of a giveaway or a lucky-customer prize live.')}</li>
          <li>{t('Events and webinars: choose a lucky winner among attendees who filled in the survey.')}</li>
          <li>{t('Teams at work: decide who speaks first in stand-up or who presents next.')}</li>
          <li>{t('Too many to-dos? Put them on the wheel and let it choose where to start.')}</li>
          <li>{t('Parties and game nights: decide who goes first, truth or dare, or the next challenge.')}</li>
          <li>{t("Can't agree on dinner? Spin and let the wheel settle it.")}</li>
        </ul>
      </Card>

      <Card title={t('Wheel features')}>
        <p>{t('{name} gives you a fast, flexible wheel spinner with every feature free.').replace('{name}', name)}</p>
        <ul>
          <li><strong>{t('Weighted entries')}:</strong> {t('make some slices bigger and more likely in Advanced mode.')}</li>
          <li><strong>{t('Multiple wheels')}:</strong> {t('run several wheels side by side and spin them together.')}</li>
          <li><strong>{t('Images')}:</strong> {t('add pictures to entries, the centre of the wheel or the background.')}</li>
          <li><strong>{t('Sounds and confetti')}:</strong> {t('ticking, drum roll, applause, fanfare and more.')}</li>
          <li><strong>{t('Share links')}:</strong> {t('create a short link anyone can open and spin.')}</li>
          <li><strong>{t('Save and open')}:</strong> {t('keep wheels in your free account or download them as a file.')}</li>
          <li><strong>{t('Google Sheets import')}:</strong> {t('load hundreds of names in seconds.')}</li>
          <li><strong>{t('API and embedding')}:</strong> {t('put a wheel on your own site or stream.')}</li>
          <li><strong>{t('Many languages')}:</strong> {t('use the site in your own language.')}</li>
        </ul>
      </Card>

      <AdSlot place="tool" className="grid-ad" />

      <Card title={t('Is the wheel truly random?')}>
        <p>{t('Yes. Every result comes from your browser’s cryptographically secure random generator (crypto.getRandomValues), not Math.random(). The winner is chosen first, then the animation lands the pointer on it.')}</p>
        <button className="btn btn-primary" onClick={() => openDialog('fairness')}>
          {t('Run 7,000 spins')}
        </button>
        <p>
          <strong>{t('Same result twice?')}</strong> {t('That is normal for true randomness - each spin is independent, like flipping a coin. To avoid repeats, remove the winner after each spin.')}
        </p>
      </Card>

      <Card title={t('How to use the wheel spinner')}>
        <p>{t('Type your entries in the box to the right of the wheel, one per line. Click the wheel to spin and get a random winner. Use Customize at the top of the page to change colours, sounds and spin time.')}</p>
        <p>
          <Link to="/page/faq">{t('Read the FAQ')}</Link>
        </p>
      </Card>

      {showStats && (
        <Card title={`${t('Activity in')} ${stats?.year || new Date().getFullYear()}`}>
          <p className="muted">{t('Wheel spins')}</p>
          <div className="stat-big">
            <Odometer value={stats?.spins || 0} />
          </div>
          <p className="muted">{t('Hours of spinning')}</p>
          <div className="stat-big">
            <Odometer value={stats?.hours || 0} />
          </div>
        </Card>
      )}

      <Card title={t('Can I use the wheel in OBS or Streamlabs?')}>
        <p>{t('Yes. Share your wheel, then add its embed link as a browser source in your streaming software.')}</p>
        <ul>
          <li>{t('Viewer giveaways from your chat')}</li>
          <li>{t('Random in-game challenges and handicaps')}</li>
          <li>{t('Character, class or loadout randomisers')}</li>
        </ul>
        <Link to="/page/streaming">{t('Streaming guide')}</Link>
      </Card>

      <Card title={t('Is my data private?')}>
        <p>{t('The wheel you are editing stays in your browser. Nothing is uploaded unless you save it to your account or create a share link.')}</p>
        <Link to="/page/privacy">{t('Privacy policy')}</Link>
      </Card>

      {site.ads_enabled === '1' && site.ads_closable !== '0' && (
        <Card title={t('Can I close the ads?')}>
          <p>{t('Ads keep this site free. Press the × next to "Close ads" and they disappear for the rest of your visit.')}</p>
        </Card>
      )}

      {tools.length > 0 && (
        <Card title={t('More pickers')}>
          <div className="tool-chips">
            {tools.map((tool) => (
              <Link key={tool.slug} to={`/${tool.slug}`} className="tool-chip">
                <span><ToolIcon icon={tool.emoji} /></span> {tool.name}
              </Link>
            ))}
          </div>
        </Card>
      )}
    </section>
  )
}
