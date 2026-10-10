import { useRef, useState } from 'react'
import { useApp } from '../../store/AppStore'
import { api, uploadImage } from '../../lib/api'
import Modal from '../Modal'
import Icon from '../Icon'

const EMOJIS = ['🎁', '🏆', '⭐', '🍕', '🍔', '🍦', '🎉', '🎲', '🚀', '❤️', '🐶', '🐱', '⚽', '🏀', '🎮', '🎵', '🌈', '💰', '☕', '🍩', '🌟', '🔥', '👑', '🦄']

function emojiToDataUrl(emoji) {
  const c = document.createElement('canvas')
  c.width = c.height = 160
  const ctx = c.getContext('2d')
  ctx.font = '128px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(emoji, 80, 90)
  return c.toDataURL('image/png')
}

/**
 * Pick an image by upload / search (Unsplash, if configured) / URL / emoji.
 * onPick(url|null, suggestedName)
 */
export default function ImagePickerDialog({ onPick, onClose, allowRemove = false }) {
  const { t, closeDialog, site } = useApp()
  const close = onClose || closeDialog
  const [tab, setTab] = useState('upload')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [url, setUrl] = useState('')
  const [q, setQ] = useState('')
  const [results, setResults] = useState(null)
  const fileRef = useRef(null)

  const done = (u, name) => {
    onPick?.(u, name)
    close()
  }

  const onFile = async (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) return setError(t('Please choose an image file.'))
    setBusy(true)
    setError('')
    try {
      const u = await uploadImage(file)
      done(u, file.name.replace(/\.[^.]+$/, ''))
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const search = async (e) => {
    e?.preventDefault()
    if (!q.trim()) return
    setBusy(true)
    setError('')
    try {
      const r = await api.get('/images/search?q=' + encodeURIComponent(q))
      if (!r.enabled) setError(t('Image search is not configured. Ask the site admin to add an Unsplash key.'))
      setResults(r.results || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title={t('Choose an image')} onClose={close} wide>
      <div className="tabs tabs-left">
        {['upload', 'search', 'emoji', 'url'].map((k) => (
          <button key={k} className={`tab ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>
            {t({ upload: 'Upload', search: 'Search', emoji: 'Emoji', url: 'Link' }[k])}
          </button>
        ))}
      </div>
      {error && <div className="alert error">{error}</div>}

      {tab === 'upload' && (
        <div
          className="dropzone"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            onFile(e.dataTransfer.files?.[0])
          }}
          onClick={() => fileRef.current?.click()}
        >
          <Icon name="upload" size={32} />
          <p>{busy ? t('Uploading…') : t('Drop an image here or click to browse')}</p>
          <p className="muted small">JPG, PNG, GIF, WEBP</p>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0])} />
        </div>
      )}

      {tab === 'search' && (
        <div>
          <form className="row" onSubmit={search}>
            <input className="input" placeholder={t('Search millions of photos')} value={q} onChange={(e) => setQ(e.target.value)} />
            <button className="btn btn-primary" disabled={busy}>{t('Search')}</button>
          </form>
          <div className="img-grid">
            {(results || []).map((r, i) => (
              <button key={i} className="img-tile" onClick={() => done(r.url, q)} title={r.author ? `Photo: ${r.author} / Unsplash` : ''}>
                <img src={r.thumb} alt="" loading="lazy" />
              </button>
            ))}
            {results && !results.length && !error && <p className="muted">{t('No images found.')}</p>}
          </div>
        </div>
      )}

      {tab === 'emoji' && (
        <div className="emoji-grid">
          {EMOJIS.map((em) => (
            <button key={em} className="emoji-tile" onClick={() => done(emojiToDataUrl(em), '')}>
              {em}
            </button>
          ))}
        </div>
      )}

      {tab === 'url' && (
        <form
          className="stack"
          onSubmit={(e) => {
            e.preventDefault()
            if (/^https?:\/\/.+/i.test(url.trim())) done(url.trim(), '')
            else setError(t('Enter a full image address starting with https://'))
          }}
        >
          <input className="input" placeholder="https://…/image.jpg" value={url} onChange={(e) => setUrl(e.target.value)} />
          <button className="btn btn-primary">{t('Use this image')}</button>
        </form>
      )}

      {allowRemove && (
        <div className="modal-foot left">
          <button className="btn btn-text danger" onClick={() => done(null)}>
            <Icon name="trash" size={16} /> {t('Remove image')}
          </button>
        </div>
      )}
      {site.allow_uploads !== '1' && tab === 'upload' && <p className="muted small">{t('Uploads may be disabled on this site.')}</p>}
    </Modal>
  )
}
