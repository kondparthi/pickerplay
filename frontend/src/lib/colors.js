import { secureRandom } from './random'

export const THEMES = [
  { name: 'Classic pastel', colors: ['#33a5e8', '#7cd992', '#f8d85b', '#b67fd6'] },
  { name: 'Brand', colors: ['#29a3e3', '#7cc22c', '#f5c518', '#5546c9', '#ef4f7a'] },
  { name: 'Vivid rainbow', colors: ['#e53935', '#fb8c00', '#fdd835', '#43a047', '#1e88e5', '#8e24aa'] },
  { name: 'Ocean', colors: ['#03256c', '#2541b2', '#1768ac', '#06bee1', '#a2d6f9'] },
  { name: 'Sunset', colors: ['#ff6b6b', '#ff8e53', '#feca57', '#ff9ff3', '#c56cf0'] },
  { name: 'Forest', colors: ['#1b4332', '#2d6a4f', '#40916c', '#74c69d', '#b7e4c7'] },
  { name: 'Candy', colors: ['#ff99c8', '#fcf6bd', '#d0f4de', '#a9def9', '#e4c1f9'] },
  { name: 'Neon', colors: ['#f72585', '#7209b7', '#3a0ca3', '#4361ee', '#4cc9f0'] },
  { name: 'Earth', colors: ['#6f4e37', '#a67b5b', '#c9a66b', '#e6ccb2', '#7f5539'] },
  { name: 'Primary', colors: ['#3369e8', '#d50f25', '#eeb211', '#009925'] },
  { name: 'Black & gold', colors: ['#111111', '#d4af37', '#333333', '#f4e5a1'] },
  { name: 'Monochrome', colors: ['#212529', '#495057', '#adb5bd', '#dee2e6'] },
  { name: 'Festive', colors: ['#c1121f', '#ffb703', '#2a9d8f', '#fb8500', '#8338ec'] },
  { name: 'Mint & coral', colors: ['#2ec4b6', '#ff9f1c', '#ffbf69', '#cbf3f0', '#ff6f59'] },
]

export function hexToRgb(hex) {
  let h = (hex || '#000').replace('#', '')
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  const n = parseInt(h.slice(0, 6), 16) || 0
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    v /= 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Black or white text, whichever reads better on `bg`. */
export function contrastText(bg) {
  return luminance(bg) > 0.42 ? '#1d1d1f' : '#ffffff'
}

export function shade(hex, pct) {
  const [r, g, b] = hexToRgb(hex)
  const f = (v) => Math.max(0, Math.min(255, Math.round(v + (pct < 0 ? v : 255 - v) * pct)))
  return '#' + [f(r), f(g), f(b)].map((v) => v.toString(16).padStart(2, '0')).join('')
}

function hslToHex(h, s, l) {
  s /= 100
  l /= 100
  const k = (n) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  return '#' + [f(0), f(8), f(4)].map((x) => Math.round(x * 255).toString(16).padStart(2, '0')).join('')
}

/** Random harmonious palette (used by the Share -> Theme step). */
export function randomPalette() {
  if (secureRandom() < 0.5) return THEMES[Math.floor(secureRandom() * THEMES.length)].colors.slice()
  const base = Math.floor(secureRandom() * 360)
  const count = 3 + Math.floor(secureRandom() * 3)
  const step = [30, 60, 72, 90, 120][Math.floor(secureRandom() * 5)]
  const sat = 55 + Math.floor(secureRandom() * 35)
  return Array.from({ length: count }, (_, i) => hslToHex((base + i * step) % 360, sat, 48 + ((i % 2) * 18)))
}

export const toColorSlots = (colors) => {
  const slots = colors.slice(0, 6).map((c) => ({ color: c, enabled: true }))
  const filler = ['#444444', '#444444', '#444444', '#444444', '#444444', '#444444']
  while (slots.length < 6) slots.push({ color: filler[slots.length], enabled: false })
  return slots
}
