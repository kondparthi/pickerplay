import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useApp } from '../store/AppStore'
import Icon from './Icon'

/**
 * Injects admin-provided ad HTML (AdSense unit or any network) and executes its scripts.
 * Re-mounts on every route change so single-page navigation requests a fresh ad.
 */
function AdHtml({ html, routeKey }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el || !html) return
    el.innerHTML = ''
    try {
      el.appendChild(document.createRange().createContextualFragment(html))
      // AdSense units pasted without their own push() call still get filled
      const ins = el.querySelectorAll('ins.adsbygoogle:not([data-adsbygoogle-status])')
      if (ins.length && !/adsbygoogle\s*\|\|\s*\[\]\)\.push/.test(html)) {
        ins.forEach(() => { try { (window.adsbygoogle = window.adsbygoogle || []).push({}) } catch { /* not loaded */ } })
      }
    } catch { /* malformed ad code – ignore */ }
    return () => { el.innerHTML = '' }
  }, [html, routeKey])
  return <div ref={ref} className="ad-content" />
}

/** Placements an admin can switch on/off: wheel, tool, team, blog_list, blog_post. */
export function adsOn(site, place) {
  if (site.ads_enabled !== '1') return false
  const places = (site.ad_places ?? 'wheel,tool,team,blog_list,blog_post').split(',').map((x) => x.trim())
  return places.includes(place)
}

/**
 * place="wheel" – the slot next to the wheel (desktop / mobile codes)
 * any other place – in-content slot (uses the in-content code, falling back to the desktop code)
 */
export default function AdSlot({ place = 'wheel', className = '' }) {
  const { site, adsClosed, closeAds, openDialog, t } = useApp()
  const { pathname } = useLocation()
  const closable = site.ads_closable !== '0'
  if (!adsOn(site, place) || (closable && adsClosed)) return null
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 760
  const html = place === 'wheel'
    ? (isMobile && site.ad_code_mobile) || site.ad_code
    : site.ad_code_content || (isMobile && site.ad_code_mobile) || site.ad_code
  if (!html) return null
  const inline = place !== 'wheel'
  return (
    <div className={`ad-slot ${inline ? 'ad-inline' : ''} ${className}`}>
      <div className="ad-links">
        {inline && <span className="ad-label">{t('Advertisement')}</span>}
        <button className="link-muted" onClick={() => openDialog('feedback', { type: 'ad_report' })}>
          {t('Report bad ad')} <Icon name="flag" size={15} />
        </button>
        {closable && (
          <button className="link-muted" onClick={closeAds}>
            {t('Close ads')} <Icon name="x" size={15} className="circle-x" />
          </button>
        )}
      </div>
      <AdHtml html={html} routeKey={pathname} />
    </div>
  )
}
