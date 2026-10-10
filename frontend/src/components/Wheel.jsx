import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react'
import {
  buildSegments, drawFrame, geometry, layout, onImageLoaded, renderWheel, segmentAt, activePalette, TAU,
} from '../lib/wheelRender'
import { randomInt, secureRandom, weightedIndex } from '../lib/random'
import { startDrumroll, stopDrumroll, tick, unlockAudio } from '../lib/audio'

// Speed-up for the first few % of the spin, then a long smooth slow-down.
const ACCEL = 0.07
const P_END = ACCEL / 2 + (1 - ACCEL) / 3
function ease(t) {
  if (t <= 0) return 0
  if (t >= 1) return 1
  const p = t < ACCEL
    ? (t * t) / (2 * ACCEL)
    : ACCEL / 2 + ((1 - ACCEL) / 3) * (1 - Math.pow((1 - t) / (1 - ACCEL), 3))
  return p / P_END
}

/**
 * Interactive canvas wheel.
 * ref.spin() -> Promise<{ entry, color } | null>
 */
const Wheel = forwardRef(function Wheel(
  { wheel, onClick, idle = true, reduceMotion = false, showHint = false, hintTop, hintBottom, ariaLabel, maxSize = 2000 },
  ref
) {
  const boxRef = useRef(null)
  const canvasRef = useRef(null)
  const wheelRef = useRef(wheel)
  wheelRef.current = wheel
  const st = useRef({
    size: 0,
    dpr: 1,
    rotation: secureRandom() * TAU,
    anim: null,
    spinning: false,
    tilt: 0,
    lastIdx: -1,
    hintAlpha: showHint ? 1 : 0,
    hint: showHint,
    highlight: null,
    dirty: true,
    segs: { all: [], shown: [] },
    bmp: null,
    resolve: null,
    raf: 0,
    last: 0,
  })

  const rebuild = useCallback((keepShown = false) => {
    const s = st.current
    if (!keepShown) s.segs = buildSegments(wheelRef.current)
    if (!s.size) return
    const { R } = geometry(s.size)
    s.bmp = renderWheel(s.segs.shown, wheelRef.current.settings, R * 2 * s.dpr)
    s.dirty = true
  }, [])

  // rebuild when entries / settings change (but never mid-spin: the winner is already locked in)
  useEffect(() => {
    if (st.current.spinning) {
      st.current.pendingRebuild = true
      return
    }
    st.current.highlight = null
    rebuild()
  }, [wheel.entries, wheel.settings, rebuild])

  useEffect(() => onImageLoaded(() => rebuild(true)), [rebuild])

  useEffect(() => {
    st.current.hint = showHint
  }, [showHint])

  // responsive sizing
  useEffect(() => {
    const box = boxRef.current
    const canvas = canvasRef.current
    const apply = () => {
      const w = Math.min(box.clientWidth, maxSize)
      const size = Math.max(120, Math.floor(w))
      const dpr = Math.min(2.5, window.devicePixelRatio || 1)
      const s = st.current
      if (size === s.size && dpr === s.dpr) return
      s.size = size
      s.dpr = dpr
      canvas.width = size * dpr
      canvas.height = size * dpr
      canvas.style.width = size + 'px'
      canvas.style.height = size + 'px'
      rebuild(true)
    }
    apply()
    const ro = new ResizeObserver(apply)
    ro.observe(box)
    return () => ro.disconnect()
  }, [rebuild, maxSize])

  // animation loop
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const frame = (now) => {
      const s = st.current
      const dt = s.last ? Math.min(0.1, (now - s.last) / 1000) : 0
      s.last = now
      const w = wheelRef.current
      const settings = w.settings || {}

      if (s.anim) {
        const t = (now - s.anim.t0) / s.anim.dur
        s.rotation = s.anim.from + (s.anim.to - s.anim.from) * ease(t)
        s.dirty = true
        if (t >= 1) finish()
      } else if (idle && !reduceMotion && !s.spinning && s.segs.shown.length) {
        s.rotation += dt * 0.07
        s.dirty = true
      }

      const idx = segmentAt(s.segs.shown, s.rotation)
      if (idx !== s.lastIdx) {
        if (s.spinning && s.lastIdx !== -1) {
          tick(settings.sound, settings.volume ?? 50)
          s.tilt = -0.45
        }
        s.lastIdx = idx
      }
      if (Math.abs(s.tilt) > 0.002) {
        s.tilt *= Math.pow(0.0005, dt)
        s.dirty = true
      }

      const targetHint = s.hint && !s.spinning ? 1 : 0
      if (s.hintAlpha !== targetHint) {
        s.hintAlpha = targetHint > s.hintAlpha ? Math.min(1, s.hintAlpha + dt * 3) : Math.max(0, s.hintAlpha - dt * 4)
        s.dirty = true
      }

      let highlight = null
      if (s.highlight) {
        const age = (now - s.highlight.t0) / 1000
        if (age > 5) s.highlight = null
        else {
          highlight = { ...s.highlight, alpha: 0.42 * (0.55 + 0.45 * Math.sin(age * 7)) * Math.min(1, (5 - age) * 2) }
          s.dirty = true
        }
      }

      if (s.dirty && s.size) {
        const palette = activePalette(settings)
        ctx.setTransform(s.dpr, 0, 0, s.dpr, 0, 0)
        drawFrame(ctx, s.size, s.bmp, {
          rotation: s.rotation,
          shadow: settings.shadow !== false,
          pointerColor: settings.pointerColor || palette[3 % palette.length],
          pointerTilt: s.tilt,
          hintAlpha: s.hintAlpha,
          hintTop,
          hintBottom,
          highlight,
        })
        s.dirty = false
      }
      s.raf = requestAnimationFrame(frame)
    }
    st.current.raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(st.current.raf)
  }, [idle, reduceMotion, hintTop, hintBottom]) // eslint-disable-line

  function finish() {
    const s = st.current
    const anim = s.anim
    s.anim = null
    s.spinning = false
    stopDrumroll()
    const settings = wheelRef.current.settings || {}
    if (settings.animateWinner && anim) s.highlight = { start: anim.seg.start, end: anim.seg.end, t0: performance.now() }
    const result = anim ? { entry: anim.entry, color: anim.seg.color } : null
    const resolve = s.resolve
    s.resolve = null
    if (s.pendingRebuild) {
      s.pendingRebuild = false
      setTimeout(() => rebuild(), 0)
    }
    if (resolve) resolve(result)
  }

  useImperativeHandle(ref, () => ({
    isSpinning: () => st.current.spinning,
    spin() {
      const s = st.current
      if (s.spinning) return Promise.resolve(null)
      unlockAudio()
      if (s.pendingRebuild || !s.segs.all.length) rebuild()
      const { all } = s.segs
      let shown = s.segs.shown
      if (!all.length) return Promise.resolve(null)
      s.highlight = null

      const pick = weightedIndex(all.map((x) => x.weight))
      const winner = all[pick]
      let target = shown.indexOf(winner)
      if (target < 0) {
        // more entries than "max names visible": show the winner in a random visible slot
        const j = randomInt(shown.length)
        shown = shown.slice()
        shown[j] = { ...winner, weight: shown[j].weight, color: shown[j].color }
        layout(shown)
        s.segs = { all, shown }
        rebuild(true)
        target = j
      }
      const seg = shown[target]
      const entry = seg.members.length > 1 ? seg.members[Math.max(0, weightedIndex(seg.members.map((m) => Number(m.weight ?? 1))))] : seg.entry

      const settings = wheelRef.current.settings || {}
      const span = seg.end - seg.start
      const point = seg.start + span * (0.08 + 0.84 * secureRandom())
      const secs = Math.max(1, Math.min(60, Number(settings.spinTime) || 10))
      const turns = settings.spinSlowly ? Math.max(1.2, secs * 0.28) : Math.max(2.5, secs * 1.05)
      const from = s.rotation
      let delta = (-point - from) % TAU
      if (delta < 0) delta += TAU
      const to = from + delta + Math.floor(turns) * TAU

      s.spinning = true
      s.hint = false
      s.anim = { from, to, t0: performance.now(), dur: secs * 1000, seg, entry }
      if (settings.sound === 'drumroll') startDrumroll(settings.volume ?? 50)
      return new Promise((resolve) => {
        s.resolve = resolve
      })
    },
  }))

  return (
    <div ref={boxRef} className="wheel-box">
      <canvas
        ref={canvasRef}
        className="wheel-canvas"
        tabIndex={0}
        role="button"
        aria-label={ariaLabel || 'Spin the wheel'}
        onClick={onClick}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !e.ctrlKey) {
            e.preventDefault()
            onClick?.()
          }
        }}
      />
    </div>
  )
})

export default Wheel
