import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { api, getToken, setToken } from '../lib/api'
import { store } from '../lib/storage'
import { newWheel } from '../lib/defaults'
import { uid } from '../lib/random'
import { makeT } from '../i18n'

const AppCtx = createContext(null)
export const useApp = () => useContext(AppCtx)
export const useT = () => useContext(AppCtx).t

const WS_KEY = 'pp.workspace.v1'
const BACKUP_KEY = 'pp.workspace.backup'
const PREFS_KEY = 'pp.prefs'

const FALLBACK_SETTINGS = {
  site_name: 'PickerPlay',
  tagline: 'Free Random Name and Team Picker Tool',
  logo_url: '/brand/logo.webp',
  logo_height: '44',
  primary_color: '#5546c9',
  secondary_color: '#29a3e3',
  accent_color: '#7cc22c',
  page_bg_from: '#dcebfa',
  page_bg_to: '#efe4f6',
  show_info_cards: '1',
  show_stats: '0',
  ads_enabled: '0',
  allow_registration: '1',
  allow_gallery: '1',
  allow_uploads: '1',
  enabled_languages: 'en,hi,te,ta,es,fr',
  gallery_tags: 'yes no,numbers,names,food,team,classroom,games',
  version: '1.0.0',
  copyright: `© ${new Date().getFullYear()} PickerPlay. All rights reserved.`,
}

function initialBoot() {
  const b = window.__PP_BOOT__
  if (b && b.settings) return { ...b, settings: { ...FALLBACK_SETTINGS, ...b.settings }, loaded: true }
  return { settings: FALLBACK_SETTINGS, pages: [], tools: [], preload: null, loaded: false }
}

function loadWorkspace(site) {
  const saved = store.get(WS_KEY)
  if (saved && Array.isArray(saved.wheels) && saved.wheels.length) {
    return { wheels: saved.wheels, active: Math.min(saved.active || 0, saved.wheels.length - 1), results: saved.results || [] }
  }
  return { wheels: [newWheel(site)], active: 0, results: [] }
}

export function AppProvider({ children }) {
  const [boot, setBoot] = useState(initialBoot)
  const site = boot.settings
  const [prefs, setPrefsState] = useState(() => ({ dark: false, reduceMotion: false, idleSpin: true, lang: '', ...store.get(PREFS_KEY, {}) }))
  const [user, setUser] = useState(null)
  const [authChecked, setAuthChecked] = useState(!getToken())
  const [ws, setWs] = useState(() => loadWorkspace(site))
  const [dialog, setDialog] = useState(null)
  const [toasts, setToasts] = useState([])
  const [panelHidden, setPanelHidden] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [adsClosed, setAdsClosed] = useState(() => {
    try {
      return sessionStorage.getItem('pp.adsClosed') === '1'
    } catch {
      return false
    }
  })

  /* ---------- bootstrap (when not injected by Laravel, e.g. vite dev) ---------- */
  useEffect(() => {
    if (boot.loaded) return
    api.get('/bootstrap')
      .then((b) => setBoot({ ...b, settings: { ...FALLBACK_SETTINGS, ...b.settings }, loaded: true }))
      .catch(() => setBoot((x) => ({ ...x, loaded: true })))
  }, []) // eslint-disable-line

  /* ---------- auth ---------- */
  useEffect(() => {
    if (!getToken()) return
    api.get('/auth/me')
      .then((r) => setUser(r.user))
      .catch(() => setToken(null))
      .finally(() => setAuthChecked(true))
  }, [])

  const login = useCallback((token, u) => {
    setToken(token)
    setUser(u)
  }, [])
  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      /* ignore */
    }
    setToken(null)
    setUser(null)
  }, [])

  /* ---------- preferences ---------- */
  const setPrefs = useCallback((patch) => {
    setPrefsState((p) => {
      const n = { ...p, ...patch }
      store.set(PREFS_KEY, n)
      return n
    })
  }, [])

  const lang = useMemo(() => {
    const enabled = (site.enabled_languages || 'en').split(',').map((s) => s.trim())
    if (prefs.lang && enabled.includes(prefs.lang)) return prefs.lang
    const nav = (navigator.language || 'en').slice(0, 2)
    return enabled.includes(nav) ? nav : 'en'
  }, [prefs.lang, site.enabled_languages])
  const t = useMemo(() => makeT(lang), [lang])

  /* ---------- white-label theming ---------- */
  useEffect(() => {
    const r = document.documentElement
    r.style.setProperty('--primary', site.primary_color || '#5546c9')
    r.style.setProperty('--secondary', site.secondary_color || '#29a3e3')
    r.style.setProperty('--accent', site.accent_color || '#7cc22c')
    // brand page gradient in light mode; dark mode uses the dark gradient from styles.css
    if (prefs.dark) {
      r.style.removeProperty('--bg-from')
      r.style.removeProperty('--bg-to')
    } else {
      r.style.setProperty('--bg-from', site.page_bg_from || '#dcebfa')
      r.style.setProperty('--bg-to', site.page_bg_to || '#efe4f6')
    }
    r.classList.toggle('dark', !!prefs.dark)
    r.classList.toggle('reduce-motion', !!prefs.reduceMotion)
    r.lang = lang
    r.dir = ['ar', 'ur', 'he', 'fa'].includes(lang) ? 'rtl' : 'ltr'
    if (site.favicon_url) {
      let link = document.querySelector('link[rel="icon"]')
      if (!link) {
        link = document.createElement('link')
        link.rel = 'icon'
        document.head.appendChild(link)
      }
      link.href = site.favicon_url
    }
    if (site.font_family && !document.getElementById('pp-wheel-font')) {
      const l = document.createElement('link')
      l.id = 'pp-wheel-font'
      l.rel = 'stylesheet'
      l.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(site.font_family)}:wght@500;600;700&display=swap`
      document.head.appendChild(l)
    }
  }, [site, prefs.dark, prefs.reduceMotion, lang])

  /* ---------- workspace persistence ---------- */
  const saveTimer = useRef(null)
  useEffect(() => {
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      store.set(WS_KEY, { wheels: ws.wheels, active: ws.active, results: ws.results.slice(0, 300) })
    }, 350)
  }, [ws])

  /* ---------- toasts ---------- */
  const toast = useCallback((message, opts = {}) => {
    const id = uid('t')
    setToasts((list) => [...list.slice(-2), { id, message, ...opts }])
    setTimeout(() => setToasts((list) => list.filter((x) => x.id !== id)), opts.duration || 5000)
    return id
  }, [])
  const dismissToast = useCallback((id) => setToasts((l) => l.filter((x) => x.id !== id)), [])

  /* ---------- workspace actions ---------- */
  const actions = useMemo(() => {
    const updateWheel = (index, patch) =>
      setWs((s) => {
        const wheels = s.wheels.slice()
        const cur = wheels[index]
        if (!cur) return s
        wheels[index] = typeof patch === 'function' ? patch(cur) : { ...cur, ...patch }
        return { ...s, wheels }
      })
    const backup = () => setWs((s) => {
      store.set(BACKUP_KEY, s)
      return s
    })
    const restoreBackup = () => {
      const b = store.get(BACKUP_KEY)
      if (b && b.wheels) setWs(b)
    }
    return {
      updateWheel,
      setEntries: (index, entries) => updateWheel(index, (w) => ({ ...w, entries })),
      updateSettings: (index, patch) => updateWheel(index, (w) => ({ ...w, settings: { ...w.settings, ...patch } })),
      setActive: (active) => setWs((s) => ({ ...s, active })),
      addWheel: (wheel) => setWs((s) => ({ ...s, wheels: [...s.wheels, wheel], active: s.wheels.length })),
      removeWheel: (index) =>
        setWs((s) => {
          if (s.wheels.length <= 1) return s
          const wheels = s.wheels.filter((_, i) => i !== index)
          return { ...s, wheels, active: Math.max(0, Math.min(s.active, wheels.length - 1)) }
        }),
      addResults: (items) => setWs((s) => ({ ...s, results: [...items, ...s.results].slice(0, 1000) })),
      setResults: (results) => setWs((s) => ({ ...s, results })),
      /** Replace everything (shared link, tool preset, open file) with undo support. */
      loadWheels: (wheels, message) => {
        backup()
        setWs({ wheels, active: 0, results: [] })
        if (message) toast(message, { action: { label: 'Undo', run: restoreBackup } })
      },
      replaceWheelsSilently: (wheels) => setWs({ wheels, active: 0, results: [] }),
      resetToDefault: (message) => {
        backup()
        setWs({ wheels: [newWheel(site)], active: 0, results: [] })
        if (message) toast(message, { action: { label: 'Undo', run: restoreBackup } })
      },
    }
  }, [site, toast])

  const openDialog = useCallback((name, props = {}) => setDialog({ name, props }), [])
  const closeDialog = useCallback(() => setDialog(null), [])

  const closeAds = useCallback(() => {
    setAdsClosed(true)
    try {
      sessionStorage.setItem('pp.adsClosed', '1')
    } catch {
      /* ignore */
    }
  }, [])

  const value = {
    boot, setBoot, site, t, lang,
    prefs, setPrefs,
    user, setUser, authChecked, login, logout,
    ws, ...actions,
    activeWheel: ws.wheels[ws.active] || ws.wheels[0],
    dialog, openDialog, closeDialog,
    toasts, toast, dismissToast,
    panelHidden, setPanelHidden,
    fullscreen, setFullscreen,
    adsClosed, closeAds,
  }
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>
}
