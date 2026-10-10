import { useCallback, useEffect, useRef } from 'react'
import confetti from 'canvas-confetti'
import { useApp } from '../store/AppStore'
import Wheel from './Wheel'
import { playAfter, popSound } from '../lib/audio'
import { activePalette } from '../lib/wheelRender'
import { api } from '../lib/api'
import { uid } from '../lib/random'

/** Renders 1..n wheels and orchestrates spins, results, popups and effects. */
export default function WheelStage() {
  const app = useApp()
  const { ws, t, prefs, addResults, openDialog, closeDialog, setEntries, fullscreen } = app
  const refs = useRef([])
  const wsRef = useRef(ws)
  wsRef.current = ws
  const hasSpun = useRef(false)

  const spin = useCallback(
    async (indexes) => {
      const wheels = wsRef.current.wheels
      if (indexes.some((i) => refs.current[i]?.isSpinning())) return
      const playable = indexes.filter((i) => wheels[i] && wheels[i].entries.some((e) => e.enabled !== false && ((e.text || '').trim() || e.image)))
      if (!playable.length) return
      hasSpun.current = true
      closeDialog()
      const started = playable.map((i) => refs.current[i]?.spin())
      const secs = Math.max(...playable.map((i) => Number(wheels[i].settings.spinTime) || 10))
      api.post('/stats/spin', { seconds: secs, wheels: playable.length }).catch(() => {})

      const outcome = await Promise.all(started)
      const items = outcome
        .map((r, k) => r && { wheelIndex: playable[k], entry: r.entry, color: r.color })
        .filter(Boolean)
      if (!items.length) return
      const latest = wsRef.current.wheels
      const s = latest[items[0].wheelIndex]?.settings || {}

      playAfter(s.afterSound, s.afterVolume ?? 50)
      if (items.some((it) => latest[it.wheelIndex]?.settings.confetti) && !prefs.reduceMotion) {
        fireConfetti(activePalette(s))
      }
      addResults(
        items.map((it) => ({
          id: uid('r'),
          text: it.entry.text,
          image: it.entry.image || '',
          wheel: latest.length > 1 ? latest[it.wheelIndex]?.title || `${t('Wheel')} ${it.wheelIndex + 1}` : '',
          at: Date.now(),
        }))
      )
      if (s.showPopup !== false) openDialog('winner', { items })
      items.forEach((it) => {
        const ws2 = latest[it.wheelIndex]
        if (ws2?.settings.autoRemove) {
          setTimeout(() => {
            const cur = wsRef.current.wheels[it.wheelIndex]
            if (!cur) return
            const idx = cur.entries.findIndex((e) => e.id === it.entry.id)
            if (idx >= 0) {
              setEntries(it.wheelIndex, cur.entries.filter((_, i) => i !== idx))
              if (cur.settings.clickOnRemove) popSound(cur.settings.afterVolume ?? 50)
            }
          }, 5000)
        }
      })
    },
    [addResults, closeDialog, openDialog, prefs.reduceMotion, setEntries, t]
  )

  // Ctrl+Enter spins every wheel
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        spin(wsRef.current.wheels.map((_, i) => i))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [spin])

  // external triggers (e.g. "spin again" button in the winner popup)
  useEffect(() => {
    const h = (e) => spin(e.detail?.indexes ?? wsRef.current.wheels.map((_, i) => i))
    window.addEventListener('pp:spin', h)
    return () => window.removeEventListener('pp:spin', h)
  }, [spin])

  const multi = ws.wheels.length > 1
  return (
    <div className={`stage ${multi ? `stage-multi stage-n${Math.min(ws.wheels.length, 4)}` : ''} ${fullscreen ? 'stage-fs' : ''}`}>
      {ws.wheels.map((w, i) => (
        <div key={w.id} className={`stage-cell ${multi && i === ws.active ? 'is-active' : ''}`}>
          {multi && (
            <button className="stage-label" onClick={() => app.setActive(i)}>
              {w.title || `${t('Wheel')} ${i + 1}`}
            </button>
          )}
          <Wheel
            ref={(r) => (refs.current[i] = r)}
            wheel={w}
            idle={prefs.idleSpin !== false}
            reduceMotion={prefs.reduceMotion}
            showHint={!hasSpun.current && i === 0}
            hintTop={t('Click to spin')}
            hintBottom={t('or press ctrl+enter')}
            ariaLabel={t('Click to spin')}
            onClick={() => {
              if (multi) app.setActive(i)
              spin([i])
            }}
          />
        </div>
      ))}
    </div>
  )
}

function fireConfetti(colors) {
  const end = Date.now() + 1400
  const opts = { particleCount: 6, spread: 70, startVelocity: 55, colors, zIndex: 3000, disableForReducedMotion: true }
  ;(function frame() {
    confetti({ ...opts, angle: 60, origin: { x: 0, y: 0.75 } })
    confetti({ ...opts, angle: 120, origin: { x: 1, y: 0.75 } })
    if (Date.now() < end) requestAnimationFrame(frame)
  })()
  confetti({ particleCount: 140, spread: 100, origin: { y: 0.45 }, colors, zIndex: 3000, disableForReducedMotion: true })
}
