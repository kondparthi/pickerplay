import { useEffect, useMemo, useRef, useState } from 'react'
import { useApp } from '../store/AppStore'
import { uid } from '../lib/random'
import Icon from './Icon'

function linesToEntries(text, prev) {
  const pool = new Map()
  for (const e of prev) {
    if (!e.text) continue
    if (!pool.has(e.text)) pool.set(e.text, [])
    pool.get(e.text).push(e)
  }
  const out = []
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/\s+$/, '')
    if (!line.trim()) continue
    const hit = pool.get(line)?.shift()
    out.push(hit || { id: uid(), text: line, weight: 1, enabled: true })
  }
  // image-only entries are not visible in the textarea - keep them
  return out.concat(prev.filter((e) => !e.text && e.image))
}

/** Simple mode: one entry per line. */
export function EntriesTextarea({ wheelIndex, entries }) {
  const { setEntries, t } = useApp()
  const [text, setText] = useState(() => entries.filter((e) => e.text).map((e) => e.text).join('\n'))
  const focused = useRef(false)
  const entriesRef = useRef(entries)
  entriesRef.current = entries

  useEffect(() => {
    if (!focused.current) setText(entries.filter((e) => e.text).map((e) => e.text).join('\n'))
  }, [entries])

  const imageOnly = entries.filter((e) => !e.text && e.image).length
  const withImages = entries.filter((e) => e.text && e.image)

  return (
    <div className="entries-simple">
      <textarea
        className="entries-textarea"
        value={text}
        spellCheck={false}
        aria-label={t('Entries, one per line')}
        placeholder={t('Type one entry per line')}
        onFocus={() => (focused.current = true)}
        onBlur={() => {
          focused.current = false
          setText(entriesRef.current.filter((e) => e.text).map((e) => e.text).join('\n'))
        }}
        onChange={(e) => {
          setText(e.target.value)
          setEntries(wheelIndex, linesToEntries(e.target.value, entriesRef.current))
        }}
      />
      {(imageOnly > 0 || withImages.length > 0) && (
        <div className="entries-images">
          {entries.filter((e) => e.image).slice(0, 40).map((e) => (
            <img key={e.id} src={e.image} alt={e.text || ''} title={e.text || ''} />
          ))}
          <span className="muted small">{t('Entries with images')}: {imageOnly + withImages.length}</span>
        </div>
      )}
    </div>
  )
}

/** Advanced mode: weights, colours, images, enable/disable per entry. */
export function EntriesAdvanced({ wheelIndex, entries }) {
  const { setEntries, openDialog, t } = useApp()
  const [limit, setLimit] = useState(300)
  const total = useMemo(() => entries.filter((e) => e.enabled !== false).reduce((a, e) => a + Number(e.weight ?? 1), 0), [entries])
  const patch = (id, p) => setEntries(wheelIndex, entries.map((e) => (e.id === id ? { ...e, ...p } : e)))
  const remove = (id) => setEntries(wheelIndex, entries.filter((e) => e.id !== id))
  const add = () => setEntries(wheelIndex, [...entries, { id: uid(), text: `${t('Entry')} ${entries.length + 1}`, weight: 1, enabled: true }])

  return (
    <div className="entries-adv">
      <div className="adv-row adv-head">
        <span />
        <span>{t('Image')}</span>
        <span>{t('Text')}</span>
        <span title={t('Higher weight = bigger slice and bigger chance')}>{t('Weight')}</span>
        <span>{t('Color')}</span>
        <span>%</span>
        <span />
      </div>
      <div className="adv-list">
        {entries.slice(0, limit).map((e) => {
          const pct = e.enabled === false || !total ? 0 : (Number(e.weight ?? 1) / total) * 100
          return (
            <div key={e.id} className={`adv-row ${e.enabled === false ? 'disabled' : ''}`}>
              <input type="checkbox" checked={e.enabled !== false} onChange={(ev) => patch(e.id, { enabled: ev.target.checked })} aria-label={t('Enabled')} />
              <button
                className="adv-img"
                title={e.image ? t('Change image') : t('Add image')}
                onClick={() =>
                  openDialog('imagePicker', {
                    allowRemove: !!e.image,
                    onPick: (url) => patch(e.id, { image: url || '' }),
                  })
                }
              >
                {e.image ? <img src={e.image} alt="" /> : <Icon name="imageplus" size={16} />}
              </button>
              <input className="adv-text" value={e.text} onChange={(ev) => patch(e.id, { text: ev.target.value })} aria-label={t('Text')} />
              <input
                className="adv-weight"
                type="number"
                min="0"
                step="0.5"
                value={e.weight ?? 1}
                onChange={(ev) => patch(e.id, { weight: Math.max(0, Number(ev.target.value)) })}
                aria-label={t('Weight')}
              />
              <span className="adv-color">
                <input type="color" value={e.color || '#cccccc'} onChange={(ev) => patch(e.id, { color: ev.target.value })} aria-label={t('Color')} />
                {e.color && (
                  <button className="mini-x" title={t('Use theme color')} onClick={() => patch(e.id, { color: '' })}>
                    ×
                  </button>
                )}
              </span>
              <span className="adv-pct">{pct ? pct.toFixed(pct < 10 ? 1 : 0) : 0}</span>
              <button className="icon-btn sm" onClick={() => remove(e.id)} aria-label={t('Delete')}>
                <Icon name="trash" size={15} />
              </button>
            </div>
          )
        })}
      </div>
      {entries.length > limit && (
        <button className="btn btn-text" onClick={() => setLimit((l) => l + 300)}>
          {t('Show more')} ({entries.length - limit})
        </button>
      )}
      <button className="btn btn-soft" onClick={add}>
        <Icon name="plus" size={16} /> {t('Add entry')}
      </button>
    </div>
  )
}
