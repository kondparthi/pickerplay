import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../store/AppStore'
import { LANGUAGES } from '../i18n'
import Icon from './Icon'
import Menu from './Menu'
import MegaMenu from './MegaMenu'

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

// Pages that show the wheel workspace. On every other page the wheel buttons
// first navigate to the wheel, so the toolbar is identical everywhere.
const NON_WHEEL = ['/team-picker', '/gallery', '/account', '/reset-password']
const isWheelPage = (p) => !NON_WHEEL.includes(p) && !p.startsWith('/blog') && !p.startsWith('/page/') && !p.startsWith('/admin') && !p.startsWith('/embed/')

// eslint-disable-next-line no-unused-vars
export default function Toolbar({ minimal = false }) {
  const app = useApp()
  const { t, openDialog, user, boot, lang, activeWheel, fullscreen, setFullscreen, logout, resetToDefault } = app
  const nav = useNavigate()
  const { pathname } = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const onWheel = isWheelPage(pathname)
  const locked = onWheel && activeWheel?.locked
  // run a wheel action; if we're not on a wheel page, open the wheel first
  const wheel = (fn) => () => {
    if (!onWheel) nav('/')
    fn()
  }
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

  const actions = [
    { key: 'customize', icon: 'palette', label: t('Customize'), onClick: wheel(() => openDialog('customize')), disabled: locked },
    { key: 'new', icon: 'new', label: t('New'), onClick: wheel(() => resetToDefault(t('Loaded default names and options'))) },
    { key: 'open', icon: 'open', label: t('Open'), onClick: () => openDialog('open') },
    { key: 'save', icon: 'save', label: t('Save'), onClick: wheel(() => openDialog('save')), disabled: locked },
    { key: 'share', icon: 'share', label: t('Share'), onClick: wheel(() => openDialog('share')), disabled: locked },
  ]

  const moreItems = [
    { label: t('Feedback'), icon: <Icon name="feedback" />, onClick: () => openDialog('feedback') },
    { label: t('FAQ'), icon: <Icon name="help" />, onClick: () => nav('/page/faq') },
    { label: t('Import Google spreadsheet'), icon: <Icon name="sheet" />, onClick: wheel(() => openDialog('importSheet')) },
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
        <MegaMenu onNavigate={() => setMobileOpen(false)} />
        <button className={`tb-btn ${pathname === '/team-picker' ? 'is-current' : ''}`} onClick={go(() => nav('/team-picker'))}>
          <Icon name="users" />
          <span>{t('Team Picker')}</span>
        </button>
        {actions.map((a) => (
          <button key={a.key} className="tb-btn" onClick={go(a.onClick)} disabled={a.disabled} title={a.label}>
            <Icon name={a.icon} />
            <span>{a.label}</span>
          </button>
        ))}
        <button className={`tb-btn ${pathname === '/gallery' ? 'is-current' : ''}`} onClick={go(() => nav('/gallery'))}>
          <Icon name="search" />
          <span>{t('Gallery')}</span>
        </button>
        <button className={`tb-btn ${pathname.startsWith('/blog') ? 'is-current' : ''}`} onClick={go(() => nav('/blog'))}>
          <Icon name="book" />
          <span>{t('Blog')}</span>
        </button>
        <button className="tb-btn tb-icon-only" onClick={go(wheel(toggleFullscreen))} title={t('Fullscreen')} aria-label={t('Fullscreen')}>
          <Icon name={fullscreen ? 'minimize' : 'maximize'} />
          <span className="mobile-label">{t('Fullscreen')}</span>
        </button>
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
