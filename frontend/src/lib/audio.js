// All sounds are synthesised with the Web Audio API - no audio files, no licensing issues.
let ctx = null
let noiseBuf = null
let lastTick = 0
let roll = null

function ac() {
  if (!ctx) {
    const C = window.AudioContext || window.webkitAudioContext
    if (!C) return null
    ctx = new C()
  }
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

/** Call from a user gesture (click / key) so browsers allow audio. */
export function unlockAudio() {
  ac()
}

function noise() {
  const c = ac()
  if (!noiseBuf) {
    noiseBuf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate)
    const d = noiseBuf.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  }
  const src = c.createBufferSource()
  src.buffer = noiseBuf
  return src
}

function out(volume) {
  const c = ac()
  const g = c.createGain()
  g.gain.value = Math.max(0, Math.min(1, volume / 100))
  g.connect(c.destination)
  return g
}

function env(gainNode, t, attack, peak, decay) {
  gainNode.gain.setValueAtTime(0.0001, t)
  gainNode.gain.exponentialRampToValueAtTime(peak, t + attack)
  gainNode.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay)
}

function tone(type, freq, start, dur, peak, dest, attack = 0.005) {
  const c = ac()
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = type
  o.frequency.setValueAtTime(freq, start)
  env(g, start, attack, peak, dur)
  o.connect(g).connect(dest)
  o.start(start)
  o.stop(start + attack + dur + 0.05)
  return o
}

/* ---------------- during spin ---------------- */

export function tick(kind, volume) {
  if (!kind || kind === 'none' || kind === 'drumroll' || volume <= 0) return
  const c = ac()
  if (!c) return
  const now = c.currentTime
  if (now - lastTick < 0.022) return // avoid a buzz on huge wheels
  lastTick = now
  const dest = out(volume)
  if (kind === 'ticking') {
    const n = noise()
    const f = c.createBiquadFilter()
    f.type = 'bandpass'
    f.frequency.value = 3200
    f.Q.value = 1.2
    const g = c.createGain()
    env(g, now, 0.001, 0.9, 0.03)
    n.connect(f).connect(g).connect(dest)
    n.start(now, Math.random())
    n.stop(now + 0.05)
    tone('square', 1900, now, 0.012, 0.08, dest, 0.001)
  } else if (kind === 'soft') {
    tone('sine', 1100, now, 0.03, 0.35, dest, 0.002)
  } else if (kind === 'wood') {
    tone('sine', 820, now, 0.06, 0.6, dest, 0.001)
    tone('triangle', 1640, now, 0.025, 0.2, dest, 0.001)
  }
}

export function startDrumroll(volume) {
  stopDrumroll()
  if (volume <= 0) return
  const c = ac()
  if (!c) return
  const dest = out(volume)
  const n = noise()
  n.loop = true
  const f = c.createBiquadFilter()
  f.type = 'lowpass'
  f.frequency.value = 900
  const g = c.createGain()
  g.gain.value = 0.35
  const lfo = c.createOscillator()
  const lfoGain = c.createGain()
  lfo.frequency.value = 18
  lfoGain.gain.value = 0.3
  lfo.connect(lfoGain).connect(g.gain)
  n.connect(f).connect(g).connect(dest)
  n.start()
  lfo.start()
  roll = { n, lfo, g, c }
}

export function stopDrumroll() {
  if (!roll) return
  const { n, lfo, g, c } = roll
  const t = c.currentTime
  g.gain.cancelScheduledValues(t)
  g.gain.setValueAtTime(g.gain.value, t)
  g.gain.linearRampToValueAtTime(0, t + 0.15)
  n.stop(t + 0.2)
  lfo.stop(t + 0.2)
  roll = null
}

/* ---------------- after spin ---------------- */

function clap(t, dest, peak) {
  const c = ac()
  const n = noise()
  const f = c.createBiquadFilter()
  f.type = 'bandpass'
  f.frequency.value = 900 + Math.random() * 1800
  f.Q.value = 0.9
  const g = c.createGain()
  env(g, t, 0.002, peak, 0.04 + Math.random() * 0.05)
  n.connect(f).connect(g).connect(dest)
  n.start(t, Math.random() * 1.5)
  n.stop(t + 0.15)
}

function applause(dest, seconds, density, peak) {
  const c = ac()
  const now = c.currentTime
  const total = Math.floor(seconds * density)
  for (let i = 0; i < total; i++) {
    const x = Math.random()
    // swell then fade
    const t = now + x * seconds
    const shape = Math.sin(Math.PI * Math.min(1, x * 1.4)) * (1 - x * 0.6)
    clap(t, dest, Math.max(0.02, peak * shape * (0.4 + Math.random() * 0.6)))
  }
}

export function playAfter(kind, volume) {
  if (!kind || kind === 'none' || volume <= 0) return
  const c = ac()
  if (!c) return
  const dest = out(volume)
  const now = c.currentTime
  switch (kind) {
    case 'applause':
      applause(dest, 3.2, 90, 0.9)
      break
    case 'subdued':
      applause(dest, 2.2, 45, 0.45)
      break
    case 'fanfare': {
      const lp = c.createBiquadFilter()
      lp.type = 'lowpass'
      lp.frequency.value = 2400
      lp.connect(dest)
      const notes = [[392, 0, 0.14], [523.25, 0.15, 0.14], [659.25, 0.3, 0.14], [783.99, 0.45, 0.9]]
      notes.forEach(([f, d, len]) => {
        tone('sawtooth', f, now + d, len, 0.22, lp, 0.02)
        tone('sawtooth', f * 1.005, now + d, len, 0.12, lp, 0.02)
      })
      break
    }
    case 'tada': {
      const chord = [523.25, 659.25, 783.99]
      chord.forEach((f) => tone('triangle', f, now, 0.1, 0.25, dest, 0.005))
      ;[...chord, 1046.5].forEach((f) => tone('triangle', f, now + 0.18, 1.2, 0.22, dest, 0.01))
      break
    }
    case 'chime':
      ;[[1318.5, 0], [1760, 0.22]].forEach(([f, d]) => {
        tone('sine', f, now + d, 1.8, 0.35, dest, 0.003)
        tone('sine', f * 2.76, now + d, 0.9, 0.08, dest, 0.003)
        tone('sine', f * 5.4, now + d, 0.4, 0.03, dest, 0.003)
      })
      break
    default:
      break
  }
}

export function popSound(volume = 50) {
  const c = ac()
  if (!c || volume <= 0) return
  const dest = out(volume)
  const now = c.currentTime
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = 'sine'
  o.frequency.setValueAtTime(700, now)
  o.frequency.exponentialRampToValueAtTime(180, now + 0.09)
  env(g, now, 0.003, 0.6, 0.09)
  o.connect(g).connect(dest)
  o.start(now)
  o.stop(now + 0.15)
}

/** Preview button in Customize. Returns a stop() function. */
export function previewSound(kind, volume, isAfter) {
  unlockAudio()
  if (isAfter) {
    playAfter(kind, volume)
    return () => {}
  }
  if (kind === 'drumroll') {
    startDrumroll(volume)
    const t = setTimeout(stopDrumroll, 2500)
    return () => {
      clearTimeout(t)
      stopDrumroll()
    }
  }
  let i = 0
  let delay = 40
  let timer
  const step = () => {
    tick(kind, volume)
    i++
    delay *= 1.12
    if (i < 22) timer = setTimeout(step, delay)
  }
  step()
  return () => clearTimeout(timer)
}
