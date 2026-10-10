import { useEffect, useRef } from 'react'
import { useApp } from '../store/AppStore'
import Icon from './Icon'

/** Injects the admin-provided ad HTML (AdSense etc.) and executes its scripts. */
function AdHtml({ html }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el || !html) return
    el.innerHTML = ''
    const frag = document.createRange().createContextualFragment(html)
    el.appendChild(frag)
    return () => {
      el.innerHTML = ''
    }
  }, [html])
  return <div ref={ref} className="ad-content" />
}

export default function AdSlot() {
  const { site, adsClosed, closeAds, openDialog, t } = useApp()
  if (site.ads_enabled !== '1' || adsClosed) return null
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 760
  const html = (isMobile && site.ad_code_mobile) || site.ad_code
  if (!html) return null
  return (
    <div className="ad-slot">
      <div className="ad-links">
        <button className="link-muted" onClick={() => openDialog('feedback', { type: 'ad_report' })}>
          {t('Report bad ad')} <Icon name="flag" size={15} />
        </button>
        <button className="link-muted" onClick={closeAds}>
          {t('Close ads')} <Icon name="x" size={15} className="circle-x" />
        </button>
      </div>
      <AdHtml html={html} />
    </div>
  )
}
