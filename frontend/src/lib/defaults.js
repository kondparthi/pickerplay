import { uid } from './random'
import { toColorSlots } from './colors'

export const SOUNDS_DURING = [
  { id: 'ticking', label: 'Ticking sound' },
  { id: 'soft', label: 'Soft click' },
  { id: 'wood', label: 'Wooden tick' },
  { id: 'drumroll', label: 'Drum roll' },
  { id: 'none', label: 'No sound' },
]

export const SOUNDS_AFTER = [
  { id: 'subdued', label: 'Subdued applause' },
  { id: 'applause', label: 'Applause' },
  { id: 'fanfare', label: 'Fanfare' },
  { id: 'tada', label: 'Ta-da' },
  { id: 'chime', label: 'Chime' },
  { id: 'none', label: 'No sound' },
]

// PickerPlay brand wheel (logo): green, pink, yellow, purple, blue – 5 slices
export const BRAND_COLORS = '#9cd60c,#ff3269,#fee20a,#7c5afe,#31c0ff'
export const DEFAULT_NAMES = 'Emma\nLiam\nOlivia\nNoah\nAva\nEthan'

export function defaultSettings(site = {}) {
  const colors = (site.default_colors || BRAND_COLORS)
    .split(',').map((c) => c.trim()).filter(Boolean)
  return {
    // During spin
    sound: 'ticking',
    volume: 50,
    displayDuplicates: true,
    spinSlowly: false,
    showTitle: true,
    spinTime: parseInt(site.default_spin_time || '10', 10) || 10,
    maxNames: 1000,
    // After spin
    afterSound: 'subdued',
    afterVolume: 50,
    animateWinner: false,
    confetti: true,
    autoRemove: false,
    showPopup: true,
    popupMessage: site.default_popup_message || 'We have a winner!',
    showRemove: true,
    clickOnRemove: false,
    // Appearance
    colorMode: 'colors',
    bgImage: '',
    colors: toColorSlots(colors),
    centerImage: '',
    centerSize: 'M',
    centerText: 'SPIN',
    textScale: 1,
    boldText: false,
    pageGradient: true,
    pageBgColor: '',
    pageBgImage: '',
    shadow: true,
    contours: false,
    pointerColor: '',
    textColor: '',
    font: '',
  }
}

export function makeEntries(texts) {
  return texts.map((t) => (typeof t === 'string' ? { id: uid(), text: t, weight: 1, enabled: true } : { id: uid(), weight: 1, enabled: true, ...t }))
}

export function defaultEntries(site = {}) {
  const raw = site.default_entries || DEFAULT_NAMES
  return makeEntries(raw.split(/\r?\n/).map((s) => s.trim()).filter(Boolean))
}

export function newWheel(site = {}, overrides = {}) {
  return {
    id: uid('w'),
    title: '',
    description: '',
    entries: defaultEntries(site),
    settings: defaultSettings(site),
    shareCode: null,
    savedId: null,
    locked: false,
    ...overrides,
  }
}

/** Convert a stored/API config ({title, entries, settings}) into a runtime wheel. */
export function wheelFromConfig(config = {}, site = {}, extra = {}) {
  const base = defaultSettings(site)
  const s = config.settings && !Array.isArray(config.settings) ? config.settings : {}
  const settings = { ...base, ...s }
  if (Array.isArray(s.colors) && s.colors.length) {
    const slots = s.colors.slice(0, 6).map((c) => ({ color: c.color || c, enabled: c.enabled !== false }))
    while (slots.length < 6) slots.push({ color: '#444444', enabled: false })
    settings.colors = slots
  }
  return {
    id: uid('w'),
    title: config.title || '',
    description: config.description || '',
    entries: (config.entries || []).map((e) => ({
      id: e.id || uid(),
      text: e.text || '',
      image: e.image || '',
      color: e.color || '',
      weight: e.weight ?? 1,
      enabled: e.enabled !== false,
      message: e.message || '',
    })),
    settings,
    shareCode: null,
    savedId: null,
    locked: false,
    ...extra,
  }
}

/** Serialise a runtime wheel for saving / sharing. */
export function wheelToConfig(w) {
  return {
    title: w.title || '',
    description: w.description || '',
    entries: w.entries.map((e) => {
      const o = { id: e.id, text: e.text }
      if (e.image) o.image = e.image
      if (e.color) o.color = e.color
      if (e.weight !== undefined && e.weight !== 1) o.weight = Number(e.weight)
      if (e.enabled === false) o.enabled = false
      if (e.message) o.message = e.message
      return o
    }),
    settings: w.settings,
  }
}
