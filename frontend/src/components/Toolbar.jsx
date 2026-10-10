import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../store/AppStore'
import { LANGUAGES } from '../i18n'
import Icon from './Icon'
import Menu from './Menu'

export function Brand() {
  const { site } = useApp()
  return (
    <Link to="/" className="brand" aria-label={site.site_name}>
      {site.logo_url ? (
        <>
          <img src={site.logo_url} alt={site.site_name} className="brand-logo brand-light" style={{ height: `${parseInt(site.logo_height || 44, 10)}px` }} />
          {site.logo_dark_url && <img src={site.logo_dark_url} alt="" className="brand-logo brand-dark" style={{ height: `${parseInt(site.logo_height || 44, 10)}px` }} />}
        </>
      ) : (
        <span className="brand-text">{site.site_name}</span>
      )}
    </Link>
  )
}

export default function Toolbar({ minimal = false }) {
  const app = useApp()
  const { t, openDialog, user, boot, lang, activeWheel, fullscreen, setFullscreen, logout, resetToDefault } = app
  const nav = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const locked = activeWheel?.locked
  const langName = LANGUAGES.find((l) => l.code === lang)?.name || 'English'

  const toggleFullscreen = () => {
    const next = !fullscreen
    setFullscreen(next)
    try {
      if (next && document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {})
      else if (!next && document.fullscreenElement) document.exitFullscreen().catch(() => {})
    } catch {
      /* ignore */
    }
  }

  const go = (fn) => () => {
    setMobileOpen(false)
    fn()
  }

  const actions = minimal
    ? []
    : [
        { key: 'customize', icon: 'palette', label: t('Customize'), onClick: () => openDialog('customize'), disabled: locked },
        { key: 'new', icon: 'new', label: t('New'), onClick: () => resetToDefault(t('Loaded default names and options')) },
        { key: 'open', icon: 'open', label: t('Open'), onClick: () => openDialog('open') },
        { key: 'save', icon: 'save', label: t('Save'), onClick: () => openDialog('save'), disabled: locked },
        { key: 'share', icon: 'share', label: t('Share'), onClick: () => openDialog('share'), disabled: locked },
      ]

  const moreItems = [
    { label: t('Feedback'), icon: <Icon name="feedback" />, onClick: () => openDialog('feedback') },
    { label: t('FAQ'), icon: <Icon name="help" />, onClick: () => nav('/page/faq') },
    !minimal && { label: t('Import Google spreadsheet'), icon: <Icon name="sheet" />, onClick: () => openDialog('importSheet') },
    { divider: true },
    user
      ? { label: t('My account'), icon: <Icon name="user" />, onClick: () => nav('/account') }
      : { label: t('Sign in'), icon: <Icon name="user" />, onClick: () => openDialog('auth') },
    user?.is_admin && { label: t('Admin panel'), icon: <Icon name="shield" />, onClick: () => nav('/admin') },
    { label: t('Preferences'), icon: <Icon name="settings" />, onClick: () => openDialog('preferences') },
    user && { label: t('Sign out'), icon: <Icon name="logout" />, onClick: () => logout() },
  ]

  const tools = boot.tools || []

  return (
    <header className="topbar">
      <Brand />
      <button className="icon-btn mobile-only" aria-label="Menu" onClick={() => setMobileOpen((o) => !o)}>
        <Icon name={mobileOpen ? 'x' : 'menu'} size={22} />
      </button>
      <nav className={`toolbar ${mobileOpen ? 'open' : ''}`}>
        {tools.length > 0 && (
          <Menu
            align="left"
            className="tools-menu"
            button={({ toggle }) => (
              <button className="tb-btn" onClick={toggle}>
                <Icon name="grid" />
                <span>{t('Pickers')}</span>
                <Icon name="down" size={14} />
              </button>
            )}
            items={[
              { label: t('Wheel spinner'), icon: <span className="emoji">🎡</span>, onClick: go(() => nav('/')) },
              ...tools.map((tool) => ({
                label: tool.name,
                icon: <span className="emoji">{tool.emoji || '🎯'}</span>,
                onClick: go(() => nav('/' + tool.slug)),
              })),
            ]}
          />
        )}
        {actions.map((a) => (
          <button key={a.key} className="tb-btn" onClick={go(a.onClick)} disabled={a.disabled} title={a.label}>
            <Icon name={a.icon} />
            <span>{a.label}</span>
          </button>
        ))}
        <button className="tb-btn" onClick={go(() => nav('/gallery'))}>
          <Icon name="search" />
          <span>{t('Gallery')}</span>
        </button>
        {!minimal && (
          <button className="tb-btn tb-icon-only" onClick={go(toggleFullscreen)} title={t('Fullscreen')} aria-label={t('Fullscreen')}>
            <Icon name={fullscreen ? 'minimize' : 'maximize'} />
            <span className="mobile-label">{t('Fullscreen')}</span>
          </button>
        )}
        <Menu
          button={({ toggle, open }) => (
            <button className={`tb-btn ${open ? 'active' : ''}`} onClick={toggle}>
              <span>{t('More')}</span>
              <Icon name="down" size={14} style={{ transform: open ? 'rotate(180deg)' : '' }} />
            </button>
          )}
          items={moreItems}
        />
        <button className="tb-btn" onClick={go(() => openDialog('language'))}>
          <Icon name="globe" />
          <span>{langName}</span>
        </button>
      </nav>
    </header>
  )
}
