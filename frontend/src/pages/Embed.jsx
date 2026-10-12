import { useEffect, useRef, useState } from 'react'
import confetti from 'canvas-confetti'
import { useApp } from '../store/AppStore'
import { api } from '../lib/api'
import { wheelFromConfig } from '../lib/defaults'
import { playAfter } from '../lib/audio'
import { activePalette } from '../lib/wheelRender'
import { contrastText } from '../lib/colors'
import Wheel from '../components/Wheel'

/**
 * /embed/{code}: transparent page for iframes / OBS browser sources.
 * postMessage API:  parent -> {type:'pickerplay:spin'}   child -> {type:'pickerplay:winner', winner, code}
 */
export default function Embed({ code }) {
  const { site, t } = useApp()
  const [wheel, setWheel] = useState(null)
  const [error, setError] = useState('')
  const [winner, setWinner] = useState(null)
  const ref = useRef(null)
  const busy = useRef(false)

  useEffect(() => {
    document.documentElement.classList.add('embed-mode')
    api.get(`/shares/${code}`)
      .then((r) => setWheel(wheelFromConfig(r.data.config, site, { title: r.data.show_title ? r.data.title : '' })))
      .catch(() => setError(t('Wheel not found')))
    return () => document.documentElement.classList.remove('embed-mode')
  }, [code]) // eslint-disable-line

  const spin = async () => {
    if (!ref.current || busy.current) return
    busy.current = true
    setWinner(null)
    window.parent?.postMessage({ type: 'pickerplay:spinning', code }, '*')
    const r = await ref.current.spin()
    busy.current = false
    if (!r) return
    const s = wheel.settings
    playAfter(s.afterSound, s.afterVolume ?? 50)
    if (s.confetti) confetti({ particleCount: 120, spread: 90, origin: { y: 0.5 }, colors: activePalette(s) })
    setWinner(r)
    api.post('/stats/spin', { seconds: s.spinTime, path: window.location.pathname }).catch(() => {})
    window.parent?.postMessage({ type: 'pickerplay:winner', code, winner: { text: r.entry.text, image: r.entry.image || null } }, '*')
  }

  useEffect(() => {
    const onMsg = (e) => {
      if (e.data && e.data.type === 'pickerplay:spin') spin()
    }
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') spin()
    }
    window.addEventListener('message', onMsg)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('message', onMsg)
      window.removeEventListener('keydown', onKey)
    }
  })

  if (error) return <div className="embed-error">{error}</div>
  if (!wheel) return null
  return (
    <div className="embed">
      {wheel.title && wheel.settings.showTitle !== false && <h1 className="embed-title">{wheel.title}</h1>}
      <div className="embed-wheel">
        <Wheel ref={ref} wheel={wheel} onClick={spin} showHint hintTop={t('Click to spin')} hintBottom={t('or press ctrl+enter')} />
      </div>
      {winner && wheel.settings.showPopup !== false && (
        <button className="embed-winner" style={{ background: winner.color, color: contrastText(winner.color) }} onClick={() => setWinner(null)}>
          <small>{wheel.settings.popupMessage}</small>
          <strong>{winner.entry.text}</strong>
        </button>
      )}
      <a className="embed-credit" href={`/${code}`} target="_blank" rel="noreferrer">{site.site_name}</a>
    </div>
  )
}
