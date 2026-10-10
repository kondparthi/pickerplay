import { useEffect, useRef, useState } from 'react'
import { useApp } from '../../store/AppStore'
import { api } from '../../lib/api'
import { randomPalette, toColorSlots } from '../../lib/colors'
import { renderStatic } from '../../lib/wheelRender'
import { wheelToConfig } from '../../lib/defaults'
import Modal from '../Modal'
import Icon from '../Icon'

function Preview({ wheel, size = 150 }) {
  const ref = useRef(null)
  useEffect(() => {
    if (ref.current) renderStatic(ref.current, wheel, size, -Math.PI / 2 + 0.3)
  }, [wheel, size])
  return <canvas ref={ref} />
}

const STEPS = ['Share', 'Theme', 'Visibility', 'Link']

export default function ShareDialog({ existing = false }) {
  const { activeWheel, ws, updateWheel, closeDialog, t, site, user, openDialog } = useApp()
  const w = activeWheel
  const [step, setStep] = useState(existing && w.shareCode ? 3 : 0)
  const [palettes, setPalettes] = useState(() => [null, randomPalette(), randomPalette(), randomPalette()])
  const [theme, setTheme] = useState(0)
  const [title, setTitle] = useState(w.title || '')
  const [description, setDescription] = useState(w.description || '')
  const [showTitle, setShowTitle] = useState(w.settings.showTitle !== false)
  const [visibility, setVisibility] = useState('link_copy')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [code, setCode] = useState(existing ? w.shareCode : null)
  const [copied, setCopied] = useState('')

  const base = window.location.origin
  const link = code ? `${base}/${code}` : ''
  const embed = code ? `<iframe src="${base}/embed/${code}" width="600" height="600" style="border:0" allow="autoplay"></iframe>` : ''
  const themed = (i) => (palettes[i] ? { ...w, settings: { ...w.settings, colorMode: 'colors', colors: toColorSlots(palettes[i]) } } : w)

  const create = async () => {
    setBusy(true)
    setError('')
    const chosen = themed(theme)
    const config = wheelToConfig({ ...chosen, title, description, settings: { ...chosen.settings, showTitle } })
    try {
      const r = await api.post('/shares', { title, description, show_title: showTitle, visibility, config })
      setCode(r.data.code)
      updateWheel(ws.active, (cur) => ({ ...cur, title, description, shareCode: r.data.code, settings: { ...chosen.settings, showTitle } }))
      setStep(3)
    } catch (e) {
      setError(e.status === 0 ? t('Could not reach the server. Check your connection and try again.') : e.message)
    } finally {
      setBusy(false)
    }
  }

  const copy = (text, key) => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(key)
      setTimeout(() => setCopied(''), 1800)
    })
  }

  return (
    <Modal onClose={closeDialog} wide hideClose className="share-modal">
      <ol className="stepper">
        {STEPS.map((s, i) => (
          <li key={s} className={i < step ? 'done' : i === step ? 'current' : ''}>
            <span className="step-dot">{i < step ? <Icon name="check" size={14} /> : i === step ? <Icon name="pencil" size={13} /> : <Icon name={['share', 'palette', 'settings', 'link'][i]} size={13} />}</span>
            <span>{t(s)}</span>
          </li>
        ))}
      </ol>
      {error && <div className="alert error">{error}</div>}

      {step === 0 && (
        <div className="share-step">
          <p>{t('If you continue, you will create a public link to your current wheel, including its names, colors and settings.')}</p>
          <p>{t('Anyone with the link can open it, and you can share it by email, website or social media. Links that are not used for 365 days are deleted.')}</p>
          <p>{t('Please keep wheels family-friendly. Wheels that break the terms of service are removed.')}</p>
          <a href="/page/terms" target="_blank" rel="noreferrer">{t('Terms & conditions')}</a>
          {!user && (
            <p className="muted small">
              {t('Tip: sign in first to see and manage your links later.')}{' '}
              <button className="linkish" onClick={() => openDialog('auth')}>{t('Sign in')}</button>
            </p>
          )}
          <div className="modal-foot">
            <button className="btn btn-text" onClick={closeDialog}>{t('Cancel')}</button>
            <button className="btn btn-primary" onClick={() => setStep(1)}>{t('Continue')}</button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="share-step">
          <h3>{t('Apply a theme')}</h3>
          <div className="theme-grid">
            {palettes.map((p, i) => (
              <button key={i} className={`theme-card ${theme === i ? 'active' : ''}`} onClick={() => setTheme(i)}>
                <Preview wheel={themed(i)} />
                <span>{i === 0 ? t('Current color theme') : `${t('Color theme')} ${i}`}</span>
              </button>
            ))}
          </div>
          <div className="center">
            <button className="btn btn-soft" onClick={() => { setPalettes([null, randomPalette(), randomPalette(), randomPalette()]); setTheme(0) }}>
              <Icon name="refresh" size={16} /> {t('Refresh color themes')}
            </button>
          </div>
          <div className="modal-foot">
            <button className="icon-btn" onClick={() => setStep(0)} aria-label={t('Back')}><Icon name="back" /></button>
            <button className="btn btn-primary" onClick={() => setStep(2)}>{t('Continue')}</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="share-step">
          <input className="input" placeholder={t('Wheel title')} value={title} maxLength={150} onChange={(e) => setTitle(e.target.value)} />
          <textarea className="input" rows={2} placeholder={t('Description (optional)')} value={description} maxLength={1000} onChange={(e) => setDescription(e.target.value)} />
          <label className="check">
            <input type="checkbox" checked={showTitle} onChange={(e) => setShowTitle(e.target.checked)} /> {t('Show the title to people who use your shared link')}
          </label>
          <div className="form-label mt">{t('Visibility')}</div>
          <label className="radio"><input type="radio" name="vis" checked={visibility === 'link_spin'} onChange={() => setVisibility('link_spin')} /> {t('Anyone with the link can spin the wheel')}</label>
          <label className="radio"><input type="radio" name="vis" checked={visibility === 'link_copy'} onChange={() => setVisibility('link_copy')} /> {t('Anyone with the link can spin and copy the wheel')}</label>
          {site.allow_gallery === '1' && (
            <label className="radio"><input type="radio" name="vis" checked={visibility === 'public'} onChange={() => setVisibility('public')} /> {t('Anyone on the Internet can find this wheel in the public gallery')}</label>
          )}
          {visibility === 'public' && !title.trim() && <p className="muted small">{t('Give the wheel a title so people can find it in the gallery.')}</p>}
          <div className="modal-foot">
            <button className="icon-btn" onClick={() => setStep(1)} aria-label={t('Back')}><Icon name="back" /></button>
            <button className="btn btn-primary" onClick={create} disabled={busy || (visibility === 'public' && !title.trim())}>
              {busy ? t('Creating…') : t('Continue')}
            </button>
          </div>
        </div>
      )}

      {step === 3 && code && (
        <div className="share-step">
          <p>{t('Link to this wheel with current names, colors and settings:')}</p>
          <div className="copy-row">
            <input className="input" readOnly value={link} onFocus={(e) => e.target.select()} />
            <button className="btn btn-success" onClick={() => copy(link, 'link')}>{copied === 'link' ? t('Copied!') : t('Copy link')}</button>
          </div>
          <details className="embed-box">
            <summary>{t('Embed on a website or in OBS')}</summary>
            <div className="copy-row">
              <input className="input mono" readOnly value={embed} onFocus={(e) => e.target.select()} />
              <button className="btn btn-soft" onClick={() => copy(embed, 'embed')}>{copied === 'embed' ? t('Copied!') : t('Copy')}</button>
            </div>
          </details>
          <p className="muted small">{t('Anyone with the link can open it. Links that are not used for 365 days are deleted.')}</p>
          <div className="share-socials">
            <a className="chip-btn" href={`https://wa.me/?text=${encodeURIComponent((title || t('Spin the wheel')) + ' ' + link)}`} target="_blank" rel="noreferrer">WhatsApp</a>
            <a className="chip-btn" href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(link)}&text=${encodeURIComponent(title || '')}`} target="_blank" rel="noreferrer">X</a>
            <a className="chip-btn" href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`} target="_blank" rel="noreferrer">Facebook</a>
            <a className="chip-btn" href={`mailto:?subject=${encodeURIComponent(title || 'Wheel')}&body=${encodeURIComponent(link)}`}>Email</a>
            <a className="chip-btn" href={link} target="_blank" rel="noreferrer"><Icon name="external" size={14} /> {t('Open')}</a>
          </div>
          <div className="modal-foot">
            {existing && <button className="btn btn-text" onClick={() => { setCode(null); setStep(0) }}>{t('Create a new link')}</button>}
            <button className="btn btn-primary" onClick={closeDialog}>{t('Close')}</button>
          </div>
        </div>
      )}
    </Modal>
  )
}
