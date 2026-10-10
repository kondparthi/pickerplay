import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../store/AppStore'
import { api } from '../../lib/api'
import { makeEntries, newWheel, wheelFromConfig } from '../../lib/defaults'
import { readFileAsText } from '../../lib/storage'
import Modal from '../Modal'
import Icon from '../Icon'

export default function OpenDialog() {
  const { user, closeDialog, t, site, loadWheels, openDialog } = useApp()
  const nav = useNavigate()
  const [tab, setTab] = useState(user ? 'mine' : 'file')
  const [list, setList] = useState(null)
  const [q, setQ] = useState('')
  const [error, setError] = useState('')
  const [link, setLink] = useState('')
  const fileRef = useRef(null)

  useEffect(() => {
    if (tab !== 'mine' || !user) return
    api.get('/wheels').then((r) => setList(r.data)).catch((e) => setError(e.message))
  }, [tab, user])

  const openSaved = async (id) => {
    try {
      const r = await api.get(`/wheels/${id}`)
      loadWheels([wheelFromConfig(r.data.config, site, { title: r.data.title, savedId: r.data.id })], t('Opened') + ': ' + r.data.title)
      closeDialog()
      nav('/')
    } catch (e) {
      setError(e.message)
    }
  }
  const remove = async (id) => {
    if (!window.confirm(t('Delete this wheel permanently?'))) return
    await api.del(`/wheels/${id}`).catch((e) => setError(e.message))
    setList((l) => l.filter((x) => x.id !== id))
  }

  const onFile = async (file) => {
    if (!file) return
    setError('')
    try {
      const text = await readFileAsText(file)
      let wheels
      if (/\.json$/i.test(file.name) || text.trim().startsWith('{')) {
        const data = JSON.parse(text)
        const configs = Array.isArray(data.wheels) ? data.wheels : [data.config || data]
        wheels = configs.map((c) => wheelFromConfig(c, site))
      } else {
        // plain text / csv: one entry per line (first column)
        const lines = text.split(/\r?\n/).map((l) => l.split(',')[0].trim()).filter(Boolean)
        wheels = [newWheel(site, { entries: makeEntries(lines), title: file.name.replace(/\.[^.]+$/, '') })]
      }
      if (!wheels.length || !wheels.some((w) => w.entries.length)) throw new Error(t('The file has no entries.'))
      loadWheels(wheels.slice(0, 8), t('Opened') + ': ' + file.name)
      closeDialog()
      nav('/')
    } catch (e) {
      setError(e.message || t('Could not read that file.'))
    }
  }

  const openLink = (e) => {
    e.preventDefault()
    const m = link.trim().match(/([a-z0-9]{3}-[a-z0-9]{3})\s*$/i)
    if (!m) return setError(t('Paste a shared link like https://site.com/abc-123'))
    closeDialog()
    nav('/' + m[1].toLowerCase())
  }

  const filtered = (list || []).filter((w) => !q || (w.title || '').toLowerCase().includes(q.toLowerCase()))

  return (
    <Modal title={t('Open')} onClose={closeDialog} wide>
      <div className="tabs tabs-left">
        <button className={`tab ${tab === 'mine' ? 'active' : ''}`} onClick={() => setTab('mine')}>{t('My wheels')}</button>
        <button className={`tab ${tab === 'file' ? 'active' : ''}`} onClick={() => setTab('file')}>{t('From a file')}</button>
        <button className={`tab ${tab === 'link' ? 'active' : ''}`} onClick={() => setTab('link')}>{t('Shared link')}</button>
      </div>
      {error && <div className="alert error">{error}</div>}

      {tab === 'mine' && (
        !user ? (
          <div className="center pad">
            <p>{t('Sign in to see the wheels saved in your account.')}</p>
            <button className="btn btn-primary" onClick={() => openDialog('auth', { then: 'open' })}>{t('Sign in')}</button>
          </div>
        ) : (
          <>
            <input className="input" placeholder={t('Search your wheels')} value={q} onChange={(e) => setQ(e.target.value)} />
            {list === null ? <p className="muted pad">{t('Loading…')}</p> : filtered.length === 0 ? (
              <p className="muted pad">{t('No saved wheels yet. Use Save to keep a wheel here.')}</p>
            ) : (
              <ul className="file-list">
                {filtered.map((w) => (
                  <li key={w.id}>
                    <button className="file-open" onClick={() => openSaved(w.id)}>
                      <strong>{w.title}</strong>
                      <span className="muted small">{w.entries_count} {t('entries')} · {new Date(w.updated_at).toLocaleDateString()}</span>
                    </button>
                    <button className="icon-btn" onClick={() => remove(w.id)} aria-label={t('Delete')}><Icon name="trash" size={16} /></button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )
      )}

      {tab === 'file' && (
        <div className="dropzone" onClick={() => fileRef.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); onFile(e.dataTransfer.files?.[0]) }}>
          <Icon name="open" size={32} />
          <p>{t('Drop a wheel file (.json) or a list (.txt / .csv) here, or click to browse')}</p>
          <input ref={fileRef} type="file" hidden accept=".json,.txt,.csv,application/json,text/plain,text/csv" onChange={(e) => onFile(e.target.files?.[0])} />
        </div>
      )}

      {tab === 'link' && (
        <form className="stack" onSubmit={openLink}>
          <input className="input" placeholder={`${window.location.origin}/abc-123`} value={link} onChange={(e) => setLink(e.target.value)} />
          <button className="btn btn-primary">{t('Open')}</button>
        </form>
      )}
    </Modal>
  )
}
