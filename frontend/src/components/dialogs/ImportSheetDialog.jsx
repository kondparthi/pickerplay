import { useState } from 'react'
import { useApp } from '../../store/AppStore'
import { api } from '../../lib/api'
import { makeEntries } from '../../lib/defaults'
import Modal from '../Modal'

const colName = (i) => String.fromCharCode(65 + i)

export default function ImportSheetDialog() {
  const { closeDialog, t, ws, setEntries, toast } = useApp()
  const [url, setUrl] = useState('')
  const [rows, setRows] = useState(null)
  const [col, setCol] = useState(0)
  const [header, setHeader] = useState(true)
  const [mode, setMode] = useState('replace')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const fetchRows = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const r = await api.post('/import/google-sheet', { url })
      if (!r.rows.length) throw new Error(t('The sheet is empty.'))
      setRows(r.rows)
      setCol(0)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const values = rows ? rows.slice(header ? 1 : 0).map((r) => (r[col] || '').trim()).filter(Boolean) : []
  const cols = rows ? Math.max(...rows.slice(0, 50).map((r) => r.length)) : 0

  const apply = () => {
    const wheel = ws.wheels[ws.active]
    const entries = makeEntries(values)
    setEntries(ws.active, mode === 'append' ? [...wheel.entries, ...entries] : entries)
    toast(`${values.length} ${t('entries imported')}`)
    closeDialog()
  }

  return (
    <Modal title={t('Import Google spreadsheet')} onClose={closeDialog} wide>
      {error && <div className="alert error">{error}</div>}
      <ol className="muted small steps-help">
        <li>{t('In Google Sheets click Share and set access to "Anyone with the link" (Viewer).')}</li>
        <li>{t('Copy the link and paste it below.')}</li>
      </ol>
      <form className="row" onSubmit={fetchRows}>
        <input className="input grow" placeholder="https://docs.google.com/spreadsheets/d/…" value={url} onChange={(e) => setUrl(e.target.value)} required />
        <button className="btn btn-primary" disabled={busy}>{busy ? t('Loading…') : t('Load')}</button>
      </form>
      {rows && (
        <>
          <div className="form-row wrap mt">
            <label className="form-label">{t('Column')}</label>
            <select className="input select sm" value={col} onChange={(e) => setCol(Number(e.target.value))}>
              {Array.from({ length: cols }, (_, i) => (
                <option key={i} value={i}>{colName(i)}{rows[0]?.[i] ? ` – ${rows[0][i].slice(0, 30)}` : ''}</option>
              ))}
            </select>
            <label className="check"><input type="checkbox" checked={header} onChange={(e) => setHeader(e.target.checked)} /> {t('First row is a header')}</label>
            <label className="radio"><input type="radio" checked={mode === 'replace'} onChange={() => setMode('replace')} /> {t('Replace entries')}</label>
            <label className="radio"><input type="radio" checked={mode === 'append'} onChange={() => setMode('append')} /> {t('Add to entries')}</label>
          </div>
          <div className="preview-box">
            {values.slice(0, 30).map((v, i) => <div key={i}>{v}</div>)}
            {values.length > 30 && <div className="muted">… +{values.length - 30}</div>}
          </div>
          <div className="modal-foot">
            <button className="btn btn-text" onClick={closeDialog}>{t('Cancel')}</button>
            <button className="btn btn-primary" disabled={!values.length} onClick={apply}>{t('Import')} {values.length}</button>
          </div>
        </>
      )}
    </Modal>
  )
}
