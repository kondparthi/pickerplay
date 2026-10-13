// Canvas wheel renderer shared by the live wheel, gallery thumbnails and share-theme previews.
import { contrastText, shade } from './colors'

export const CENTER_RATIO = { S: 0.17, M: 0.25, L: 0.33, XL: 0.42 }
export const TAU = Math.PI * 2
const DEFAULT_FONT = 'Quicksand, "Segoe UI", Roboto, sans-serif'

/* ---------- image cache ---------- */
const images = new Map()
const listeners = new Set()
export function onImageLoaded(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
export function getImage(url) {
  if (!url) return null
  let rec = images.get(url)
  if (!rec) {
    const img = new Image()
    rec = { img, ok: false }
    images.set(url, rec)
    img.onload = () => {
      rec.ok = true
      listeners.forEach((fn) => fn(url))
    }
    img.onerror = () => {
      rec.ok = false
    }
    img.decoding = 'async'
    img.src = url
  }
  return rec.ok ? rec.img : null
}

/* ---------- segments ---------- */
export function activePalette(settings) {
  const p = (settings.colors || []).filter((c) => c.enabled).map((c) => c.color)
  return p.length ? p : ['#9cd60c', '#ff3269', '#fee20a', '#7c5afe', '#31c0ff']
}

/**
 * Turns entries into drawable segments.
 * Returns { all, shown } - `all` is the full weighted list used for picking,
 * `shown` the (possibly truncated, see maxNames) list drawn on the wheel.
 */
export function buildSegments(wheel) {
  const s = wheel.settings || {}
  const valid = (wheel.entries || []).filter(
    (e) => e.enabled !== false && ((e.text || '').trim() || e.image) && Number(e.weight ?? 1) > 0
  )
  let segs
  if (s.displayDuplicates === false) {
    const map = new Map()
    segs = []
    for (const e of valid) {
      const key = (e.text || '').trim().toLowerCase() + '|' + (e.image || '')
      const w = Number(e.weight ?? 1)
      if (map.has(key)) {
        const seg = map.get(key)
        seg.weight += w
        seg.members.push(e)
      } else {
        const seg = { entry: e, members: [e], weight: w }
        map.set(key, seg)
        segs.push(seg)
      }
    }
  } else {
    segs = valid.map((e) => ({ entry: e, members: [e], weight: Number(e.weight ?? 1) }))
  }

  const palette = activePalette(s)
  segs.forEach((seg, i) => {
    let c = palette[i % palette.length]
    if (i === segs.length - 1 && i > 0 && palette.length > 2 && c === segs[0].color) c = palette[(i + 1) % palette.length]
    seg.color = seg.entry.color || c
  })

  const max = Math.max(4, Number(s.maxNames) || 1000)
  const shown = segs.length > max ? segs.slice(0, max) : segs
  layout(shown)
  return { all: segs, shown }
}

export function layout(segs) {
  const total = segs.reduce((a, b) => a + b.weight, 0) || 1
  let acc = 0
  for (const seg of segs) {
    seg.start = (acc / total) * TAU
    acc += seg.weight
    seg.end = (acc / total) * TAU
  }
  return segs
}

/** Index of the segment under the pointer (pointer sits at screen angle 0 = 3 o'clock). */
export function segmentAt(segs, rotation) {
  if (!segs.length) return -1
  let a = (-rotation) % TAU
  if (a < 0) a += TAU
  let lo = 0
  let hi = segs.length - 1
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (segs[mid].end <= a) lo = mid + 1
    else hi = mid
  }
  return lo
}

/* ---------- offscreen wheel bitmap ---------- */
export function renderWheel(segs, settings, diameter, opts = {}) {
  const font = settings.font || opts.font || DEFAULT_FONT
  const c = document.createElement('canvas')
  c.width = c.height = Math.max(2, Math.round(diameter))
  const ctx = c.getContext('2d')
  const R = diameter / 2
  ctx.translate(R, R)

  const imageMode = settings.colorMode === 'image' && settings.bgImage
  const bg = imageMode ? getImage(settings.bgImage) : null
  const centerR = R * (CENTER_RATIO[settings.centerSize] || CENTER_RATIO.S)

  // background / slices
  ctx.save()
  ctx.beginPath()
  ctx.arc(0, 0, R, 0, TAU)
  ctx.clip()
  if (!segs.length) {
    ctx.fillStyle = '#e8e8ee'
    ctx.fillRect(-R, -R, diameter, diameter)
  } else if (imageMode) {
    ctx.fillStyle = '#ddd'
    ctx.fillRect(-R, -R, diameter, diameter)
    if (bg) drawCover(ctx, bg, -R, -R, diameter, diameter)
  } else {
    for (const seg of segs) {
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.arc(0, 0, R + 1, seg.start, seg.end)
      ctx.closePath()
      ctx.fillStyle = seg.color
      ctx.fill()
    }
  }

  // contours / separators
  if ((settings.contours || imageMode) && segs.length > 1 && segs.length <= 400) {
    ctx.strokeStyle = imageMode ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.28)'
    ctx.lineWidth = Math.max(1, R * 0.006)
    for (const seg of segs) {
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(Math.cos(seg.start) * R, Math.sin(seg.start) * R)
      ctx.stroke()
    }
  }

  // labels
  const scale = Math.max(0.5, Math.min(3, Number(settings.textScale) || 1))
  const weight = settings.boldText ? 800 : 600
  const rOuter = R * 0.93
  const rInner = centerR + R * 0.035
  const avail = rOuter - rInner
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'right'
  for (const seg of segs) {
    const span = seg.end - seg.start
    if (span <= 0) continue
    const mid = (seg.start + seg.end) / 2
    const e = seg.entry
    const textColor = settings.textColor || (imageMode ? '#ffffff' : contrastText(seg.color))
    ctx.save()
    ctx.rotate(mid)

    let textRight = rOuter
    const img = e.image ? getImage(e.image) : null
    if (img) {
      const chord = span >= Math.PI ? R : 2 * (R * 0.7) * Math.sin(span / 2)
      const size = Math.max(4, Math.min(chord * 0.8, R * 0.36, avail * (e.text ? 0.45 : 0.8)))
      ctx.save()
      const x = rOuter - size
      ctx.beginPath()
      roundRect(ctx, x, -size / 2, size, size, size * 0.12)
      ctx.clip()
      drawCover(ctx, img, x, -size / 2, size, size)
      ctx.restore()
      textRight = x - R * 0.02
    }

    const text = (e.text || '').trim()
    if (text) {
      const room = textRight - rInner
      const rRef = rInner + room * 0.55
      const arcLimit = span >= Math.PI ? R * 0.16 : 2 * rRef * Math.sin(span / 2) * 0.8
      let fs = Math.min(R * 0.135 * scale, arcLimit)
      if (fs >= R * 0.012 && room > 4) {
        ctx.font = `${weight} ${fs}px ${font}`
        let w = ctx.measureText(text).width
        if (w > room) {
          fs = Math.max(fs * (room / w) * 0.97, Math.min(fs, R * 0.045))
          ctx.font = `${weight} ${fs}px ${font}`
          w = ctx.measureText(text).width
        }
        let label = text
        if (w > room * 1.01) label = truncate(ctx, text, room)
        if (imageMode) {
          ctx.lineWidth = Math.max(2, fs * 0.16)
          ctx.strokeStyle = 'rgba(0,0,0,0.55)'
          ctx.lineJoin = 'round'
          ctx.strokeText(label, textRight, 0)
        }
        ctx.fillStyle = textColor
        ctx.fillText(label, textRight, 0)
      }
    }
    ctx.restore()
  }
  ctx.restore()

  // rim
  ctx.beginPath()
  ctx.arc(0, 0, R - Math.max(1, R * 0.006), 0, TAU)
  ctx.lineWidth = Math.max(1.5, R * 0.012)
  ctx.strokeStyle = 'rgba(0,0,0,0.12)'
  ctx.stroke()

  // centre
  ctx.save()
  ctx.beginPath()
  ctx.arc(0, 0, centerR, 0, TAU)
  ctx.fillStyle = '#ffffff'
  ctx.shadowColor = 'rgba(0,0,0,0.18)'
  ctx.shadowBlur = R * 0.03
  ctx.fill()
  ctx.restore()
  const centerImg = settings.centerImage ? getImage(settings.centerImage) : null
  if (centerImg) {
    ctx.save()
    ctx.beginPath()
    ctx.arc(0, 0, centerR, 0, TAU)
    ctx.clip()
    drawCover(ctx, centerImg, -centerR, -centerR, centerR * 2, centerR * 2)
    ctx.restore()
  }
  return c
}

function drawCover(ctx, img, x, y, w, h) {
  const ir = img.width / img.height
  const r = w / h
  let sw = img.width
  let sh = img.height
  let sx = 0
  let sy = 0
  if (ir > r) {
    sw = img.height * r
    sx = (img.width - sw) / 2
  } else {
    sh = img.width / r
    sy = (img.height - sh) / 2
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h)
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function truncate(ctx, text, room) {
  let lo = 0
  let hi = text.length
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1
    if (ctx.measureText(text.slice(0, mid) + '…').width <= room) lo = mid
    else hi = mid - 1
  }
  return lo > 0 ? text.slice(0, lo) + '…' : ''
}

/* ---------- per-frame composition ---------- */
export function geometry(size) {
  const R = size * 0.445
  return { cx: size * 0.48, cy: size / 2, R }
}

export function drawFrame(ctx, size, wheelBitmap, state) {
  const { cx, cy, R } = geometry(size)
  ctx.clearRect(0, 0, size, size)

  if (state.shadow) {
    // soft outer glow + offset drop shadow, then a white rim around the wheel
    ctx.save()
    ctx.beginPath()
    ctx.arc(cx, cy, R * 1.012, 0, TAU)
    ctx.shadowColor = 'rgba(20,16,60,0.38)'
    ctx.shadowBlur = R * 0.11
    ctx.shadowOffsetY = R * 0.035
    ctx.fillStyle = '#fff'
    ctx.fill()
    ctx.restore()
  }

  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(state.rotation)
  if (wheelBitmap) ctx.drawImage(wheelBitmap, -R, -R, R * 2, R * 2)

  // animate winning entry: dim everything except the winner
  if (state.highlight && state.highlight.alpha > 0) {
    const { start, end, alpha } = state.highlight
    ctx.beginPath()
    ctx.arc(0, 0, R, 0, TAU)
    ctx.moveTo(0, 0)
    ctx.arc(0, 0, R, end, start, true)
    ctx.closePath()
    ctx.fillStyle = `rgba(0,0,0,${alpha})`
    ctx.fill('evenodd')
  }
  ctx.restore()

  if (state.shadow) {
    ctx.save()
    ctx.beginPath()
    ctx.arc(cx, cy, R, 0, TAU)
    ctx.lineWidth = Math.max(2, R * 0.022)
    ctx.strokeStyle = 'rgba(255,255,255,0.95)'
    ctx.stroke()
    ctx.restore()
  }

  if (state.centerText) drawCenterLabel(ctx, cx, cy, R * (CENTER_RATIO[state.centerSize] || CENTER_RATIO.M), state.centerText, R)

  drawPointer(ctx, cx + R, cy, R, state.pointerColor || '#5546c9', state.pointerTilt || 0)

  if (state.hintAlpha > 0 && !state.centerText) {
    ctx.save()
    ctx.globalAlpha = state.hintAlpha
    const font = `700 ${Math.round(R * 0.15)}px Roboto, Arial, sans-serif`
    arcText(ctx, state.hintTop || 'Click to spin', cx, cy, R * 0.6, -Math.PI / 2, true, font)
    arcText(ctx, state.hintBottom || 'or press ctrl+enter', cx, cy, R * 0.66, Math.PI / 2, false, `700 ${Math.round(R * 0.12)}px Roboto, Arial, sans-serif`)
    ctx.restore()
  }
}

/** White hub with a soft shadow and a label (e.g. SPIN). Drawn every frame so it never rotates. */
function drawCenterLabel(ctx, cx, cy, r, text, R) {
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, TAU)
  ctx.shadowColor = 'rgba(0,0,0,0.28)'
  ctx.shadowBlur = R * 0.05
  ctx.shadowOffsetY = R * 0.012
  const g = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.35, r * 0.1, cx, cy, r)
  g.addColorStop(0, '#ffffff')
  g.addColorStop(1, '#eef0f6')
  ctx.fillStyle = g
  ctx.fill()
  ctx.shadowColor = 'transparent'
  ctx.lineWidth = Math.max(1, R * 0.008)
  ctx.strokeStyle = 'rgba(0,0,0,0.08)'
  ctx.stroke()
  let fs = r * 0.62
  ctx.font = `800 ${fs}px Poppins, Quicksand, "Segoe UI", Roboto, sans-serif`
  const w = ctx.measureText(text).width
  if (w > r * 1.6) {
    fs *= (r * 1.6) / w
    ctx.font = `800 ${fs}px Poppins, Quicksand, "Segoe UI", Roboto, sans-serif`
  }
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#1b1b2b'
  ctx.fillText(text, cx, cy + fs * 0.04)
  ctx.restore()
}

function drawPointer(ctx, x, y, R, color, tilt) {
  const len = R * 0.13
  const half = R * 0.065
  ctx.save()
  ctx.translate(x + len * 0.55, y)
  ctx.rotate(tilt)
  ctx.shadowColor = 'rgba(0,0,0,0.35)'
  ctx.shadowBlur = R * 0.02
  ctx.shadowOffsetY = R * 0.008
  ctx.beginPath()
  ctx.moveTo(-len, 0)
  ctx.lineTo(len * 0.25, -half)
  ctx.quadraticCurveTo(len * 0.05, 0, len * 0.25, half)
  ctx.closePath()
  const g = ctx.createLinearGradient(0, -half, 0, half)
  g.addColorStop(0, shade(color, 0.35))
  g.addColorStop(1, shade(color, -0.15))
  ctx.fillStyle = g
  ctx.fill()
  ctx.shadowColor = 'transparent'
  ctx.lineWidth = Math.max(1, R * 0.006)
  ctx.strokeStyle = shade(color, -0.35)
  ctx.stroke()
  ctx.restore()
}

function arcText(ctx, text, cx, cy, r, centerAngle, top, font) {
  ctx.font = font
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.lineJoin = 'round'
  const widths = [...text].map((ch) => ctx.measureText(ch).width * 1.04)
  const total = widths.reduce((a, b) => a + b, 0) / r
  let a = top ? centerAngle - total / 2 : centerAngle + total / 2
  ;[...text].forEach((ch, i) => {
    const w = widths[i] / r
    const ang = top ? a + w / 2 : a - w / 2
    ctx.save()
    ctx.translate(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r)
    ctx.rotate(top ? ang + Math.PI / 2 : ang - Math.PI / 2)
    ctx.lineWidth = r * 0.06
    ctx.strokeStyle = 'rgba(0,0,0,0.55)'
    ctx.strokeText(ch, 0, 0)
    ctx.fillStyle = '#ffffff'
    ctx.fillText(ch, 0, 0)
    ctx.restore()
    a = top ? a + w : a - w
  })
}

/** Static render into an existing canvas (gallery cards, theme previews). */
export function renderStatic(canvas, wheel, cssSize, rotation = 0) {
  const dpr = Math.min(2, window.devicePixelRatio || 1)
  canvas.width = cssSize * dpr
  canvas.height = cssSize * dpr
  canvas.style.width = cssSize + 'px'
  canvas.style.height = cssSize + 'px'
  const ctx = canvas.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  const { shown } = buildSegments(wheel)
  const { R } = geometry(cssSize)
  const bmp = renderWheel(shown, wheel.settings, R * 2 * dpr)
  drawFrame(ctx, cssSize, bmp, {
    rotation,
    shadow: wheel.settings.shadow !== false,
    pointerColor: pointerColorFor(wheel.settings, shown, rotation),
    ...centerLabel(wheel.settings),
  })
}

/** Pointer takes the colour of the slice it points at, unless a fixed colour is chosen. */
export function pointerColorFor(settings, shown, rotation) {
  if (settings.pointerColor) return settings.pointerColor
  if (settings.colorMode !== 'image' && shown.length) {
    const seg = shown[segmentAt(shown, rotation)]
    if (seg?.color) return seg.color
  }
  const p = activePalette(settings)
  return p[2 % p.length]
}

/** Centre label settings (hidden when a centre image is used). */
export function centerLabel(settings) {
  const text = settings.centerImage ? '' : (settings.centerText ?? 'SPIN').trim()
  return { centerText: text, centerSize: settings.centerSize || 'M' }
}
