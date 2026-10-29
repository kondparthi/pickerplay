import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useApp } from '../store/AppStore'
import { store } from '../lib/storage'

const KEY = 'pp.cookieConsent'
export const COOKIE_EVENT = 'pp:cookie-settings'
export const openCookieSettings = () => window.dispatchEvent(new Event(COOKIE_EVENT))
export const cookieChoice = () => store.get(KEY)?.choice || null

/** Tell Google tags (Analytics / AdSense, Consent Mode v2) what the visitor chose. */
function applyConsent(choice) {
  const g = choice === 'all' ? 'granted' : 'denied'
  try {
    if (typeof window.gtag === 'function') {
      window.gtag('consent', 'update', { ad_storage: g, analytics_storage: g, ad_user_data: g, ad_personalization: g })
    }
  } catch { /* ignore */ }
}

/** Cookie consent box. Switched on/off and worded in Admin -> Branding & settings -> Cookie box. */
export default function CookieBanner({ preview = false, settings }) {
  const app = useApp()
  const site = settings || app.site
  const { t } = app
  const { pathname } = useLocation()
  const [open, setOpen] = useState(() => preview || !store.get(KEY))

  useEffect(() => {
    if (preview) return
    const reopen = () => setOpen(true)
    window.addEventListener(COOKIE_EVENT, reopen)
    return () => window.removeEventListener(COOKIE_EVENT, reopen)
  }, [preview])

  if (site.cookie_enabled !== '1' && !preview) return null
  if (!preview && (pathname.startsWith('/admin') || pathname.startsWith('/embed/'))) return null
  if (!open) return null

  const choose = (choice) => {
    if (preview) return
    store.set(KEY, { choice, at: new Date().toISOString() })
    applyConsent(choice)
    setOpen(false)
  }
  const style = site.cookie_style === 'bar' ? 'bar' : 'box'
  const policy = site.cookie_policy_url || '/page/privacy'
  const internal = policy.startsWith('/')

  return (
    <div className={`cookie-${style} ${preview ? 'cookie-preview' : ''}`} role="dialog" aria-live="polite" aria-label={t('Cookie consent')}>
      <div className="cookie-body">
        {site.cookie_title && <b className="cookie-title">{site.cookie_title}</b>}
        <p>
          {site.cookie_text || t('We use cookies to keep the site working, understand how it is used and show ads.')}{' '}
          {internal ? <Link to={policy}>{t('Learn more')}</Link> : <a href={policy} target="_blank" rel="noreferrer">{t('Learn more')}</a>}
        </p>
      </div>
      <div className="cookie-btns">
        {site.cookie_show_reject !== '0' && <button className="btn btn-soft" onClick={() => choose('necessary')}>{site.cookie_reject || t('Only necessary')}</button>}
        <button className="btn btn-primary" onClick={() => choose('all')}>{site.cookie_accept || t('Accept all')}</button>
      </div>
    </div>
  )
}
