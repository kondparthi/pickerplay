import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../store/AppStore'
import { newWheel } from '../lib/defaults'
import { shuffle, uid } from '../lib/random'
import Icon from './Icon'
import Menu from './Menu'
import { EntriesAdvanced, EntriesTextarea } from './EntriesEditor'

export default function SidePanel() {
  const app = useApp()
  const { ws, t, site, setEntries, setActive, addWheel, removeWheel, setResults, openDialog, panelHidden, setPanelHidden, updateWheel } = app
  const [tab, setTab] = useState('entries')
  const [advanced, setAdvanced] = useState(false)
  const index = ws.active
  const wheel = ws.wheels[index]
  const entries = wheel.entries

  const sortEntries = () => {
    const sorted = entries.slice().sort((a, b) => (a.text || '').localeCompare(b.text || '', undefined, { numeric: true, sensitivity: 'base' }))
    const already = sorted.every((e, i) => e.id === entries[i].id)
    setEntries(index, already ? sorted.reverse() : sorted)
  }

  const addImageEntry = () =>
    openDialog('imagePicker', {
      onPick: (url, name) => url && setEntries(index, [...entries, { id: uid(), text: name || '', image: url, weight: 1, enabled: true }]),
    })

  if (panelHidden) {
    return (
      <aside className="panel panel-collapsed">
        <button className="panel-toggle" onClick={() => setPanelHidden(false)} aria-label={t('Show entries')}>
          <Icon name="left" />
        </button>
      </aside>
    )
  }

  return (
    <aside className="panel card">
      <button className="panel-toggle" onClick={() => setPanelHidden(true)} aria-label={t('Hide entries')}>
        <Icon name="right" />
      </button>

      {ws.wheels.length > 1 && (
        <div className="wheel-tabs">
          {ws.wheels.map((w, i) => (
            <button key={w.id} className={`wheel-tab ${i === index ? 'active' : ''}`} onClick={() => setActive(i)}>
              {w.title || `${t('Wheel')} ${i + 1}`}
            </button>
          ))}
        </div>
      )}

      <div className="tabs">
        <button className={`tab ${tab === 'entries' ? 'active' : ''}`} onClick={() => setTab('entries')}>
          {t('Entries')} <span className="badge">{entries.length}</span>
        </button>
        <button className={`tab ${tab === 'results' ? 'active' : ''}`} onClick={() => setTab('results')}>
          {t('Results')} <span className="badge">{ws.results.length}</span>
        </button>
      </div>

      {tab === 'entries' && (
        wheel.locked ? (
          <div className="locked-note">
            <Icon name="lock" size={28} />
            <p>{t('The owner of this wheel has hidden its entries.')}</p>
            <p className="muted small">{entries.length} {t('entries')}</p>
          </div>
        ) : (
          <>
            <div className="panel-tools">
              <button className="chip-btn" onClick={() => setEntries(index, shuffle(entries))}>
                <Icon name="shuffle" size={16} /> {t('Shuffle')}
              </button>
              <button className="chip-btn" onClick={sortEntries}>
                <Icon name="sort" size={16} /> {t('Sort')}
              </button>
              <Menu
                align="left"
                button={({ toggle }) => (
                  <button className="chip-btn" onClick={toggle}>
                    <Icon name="imageplus" size={16} /> {t('Add image')} <Icon name="down" size={14} />
                  </button>
                )}
                items={[
                  { label: t('Add image as entry'), icon: <Icon name="imageplus" />, onClick: addImageEntry },
                  { label: t('Image at the center of the wheel'), icon: <Icon name="image" />, onClick: () => openDialog('imagePicker', { allowRemove: !!wheel.settings.centerImage, onPick: (url) => app.updateSettings(index, { centerImage: url || '' }) }) },
                  { label: t('Wheel background image'), icon: <Icon name="palette" />, onClick: () => openDialog('imagePicker', { allowRemove: !!wheel.settings.bgImage, onPick: (url) => app.updateSettings(index, { bgImage: url || '', colorMode: url ? 'image' : 'colors' }) }) },
                ]}
              />
            </div>
            <label className="check small">
              <input type="checkbox" checked={advanced} onChange={(e) => setAdvanced(e.target.checked)} /> {t('Advanced')}
            </label>
            {advanced ? <EntriesAdvanced wheelIndex={index} entries={entries} /> : <EntriesTextarea key={wheel.id} wheelIndex={index} entries={entries} />}
          </>
        )
      )}

      {tab === 'results' && (
        <div className="results">
          <div className="panel-tools">
            <button className="chip-btn" onClick={() => setResults(ws.results.slice().sort((a, b) => a.text.localeCompare(b.text, undefined, { numeric: true })))}>
              <Icon name="sort" size={16} /> {t('Sort')}
            </button>
            <button className="chip-btn" onClick={() => setResults([])} disabled={!ws.results.length}>
              <Icon name="trash" size={16} /> {t('Clear the list')}
            </button>
            <button
              className="chip-btn"
              disabled={!ws.results.length}
              onClick={() => {
                navigator.clipboard?.writeText(ws.results.map((r) => r.text).join('\n'))
                app.toast(t('Copied to clipboard'))
              }}
            >
              <Icon name="copy" size={16} /> {t('Copy')}
            </button>
          </div>
          {ws.results.length === 0 ? (
            <p className="muted center pad">{t('Spin the wheel to see results here.')}</p>
          ) : (
            <ol className="results-list">
              {ws.results.map((r) => (
                <li key={r.id}>
                  {r.image && <img src={r.image} alt="" />}
                  <span className="r-text">{r.text}</span>
                  {r.wheel && <span className="r-wheel">{r.wheel}</span>}
                  <time>{new Date(r.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}

      <div className="panel-bottom">
        <div className="split-btn">
          <button className="btn btn-soft" onClick={() => addWheel(newWheel(site, { title: '' }))} disabled={ws.wheels.length >= 8}>
            <Icon name="plus" size={18} /> {t('Add wheel')}
          </button>
          <Menu
            button={({ toggle }) => (
              <button className="btn btn-soft split-arrow" onClick={toggle} aria-label={t('More wheel options')}>
                <Icon name="down" size={16} />
              </button>
            )}
            items={[
              { label: t('Duplicate this wheel'), icon: <Icon name="copy" />, onClick: () => addWheel({ ...wheel, id: uid('w'), savedId: null, shareCode: null, locked: false, entries: wheel.entries.map((e) => ({ ...e, id: uid() })) }), disabled: wheel.locked || ws.wheels.length >= 8 },
              { label: t('Rename this wheel'), icon: <Icon name="pencil" />, onClick: () => openDialog('editTitle') },
              { label: t('Remove this wheel'), icon: <Icon name="trash" />, onClick: () => removeWheel(index), disabled: ws.wheels.length <= 1 },
              { divider: true },
              { label: t('Run 10,000 spins'), icon: <Icon name="chart" />, onClick: () => openDialog('fairness') },
            ]}
          />
        </div>
        {!wheel.locked && tab === 'entries' && (
          <button className="btn btn-text small" onClick={() => updateWheel(index, { entries: [] })} disabled={!entries.length}>
            {t('Clear entries')}
          </button>
        )}
      </div>
      <div className="panel-version">
        <span>
          {t('Version')} {site.version}
        </span>
        <Link to="/page/changelog">{t('Changelog')}</Link>
      </div>
    </aside>
  )
}
