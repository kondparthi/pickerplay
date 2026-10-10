import { useEffect } from 'react'
import { useApp } from '../store/AppStore'
import Toolbar from './Toolbar'
import LeftColumn from './LeftColumn'
import WheelStage from './WheelStage'
import SidePanel from './SidePanel'
import Footer from './Footer'
import Icon from './Icon'

export default function Workspace({ children, heading }) {
  const { activeWheel, panelHidden, fullscreen, setFullscreen, site, t } = useApp()
  const s = activeWheel.settings

  useEffect(() => {
    const onFs = () => {
      if (!document.fullscreenElement) setFullscreen(false)
    }
    document.addEventListener('fullscreenchange', onFs)
    return () => document.removeEventListener('fullscreenchange', onFs)
  }, [setFullscreen])

  const bgStyle = {}
  if (s.pageBgImage) {
    bgStyle.backgroundImage = `url("${s.pageBgImage}")`
    bgStyle.backgroundSize = 'cover'
    bgStyle.backgroundPosition = 'center'
  } else if (s.pageBgColor) {
    bgStyle.background = s.pageBgColor
  } else if (s.pageGradient === false) {
    bgStyle.background = 'var(--surface-2)'
  }

  if (fullscreen) {
    return (
      <div className="fs-wrap app-bg" style={bgStyle}>
        <div className="fs-bar">
          <span className="fs-brand">{site.site_name}</span>
          <button className="icon-btn" onClick={() => { setFullscreen(false); if (document.fullscreenElement) document.exitFullscreen().catch(() => {}) }} aria-label={t('Exit fullscreen')}>
            <Icon name="minimize" />
          </button>
        </div>
        {s.showTitle !== false && activeWheel.title && <h1 className="fs-title">{activeWheel.title}</h1>}
        <WheelStage />
      </div>
    )
  }

  return (
    <div className="app">
      <Toolbar />
      <main className="app-bg" style={bgStyle}>
        {heading}
        <section className={`workspace ${panelHidden ? 'panel-hidden' : ''}`}>
          <LeftColumn />
          <WheelStage />
          <SidePanel />
        </section>
      </main>
      {children}
      <Footer />
    </div>
  )
}
