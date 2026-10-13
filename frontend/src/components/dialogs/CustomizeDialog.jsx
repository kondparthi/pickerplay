import { useEffect, useRef, useState } from 'react'
import { useApp } from '../../store/AppStore'
import { SOUNDS_AFTER, SOUNDS_DURING } from '../../lib/defaults'
import { THEMES, toColorSlots } from '../../lib/colors'
import { previewSound } from '../../lib/audio'
import Modal from '../Modal'
import Icon from '../Icon'
import Menu from '../Menu'
import ImagePickerDialog from './ImagePickerDialog'

function SoundRow({ label, value, volume, options, onChange, onVolume, isAfter, t }) {
  const stopRef = useRef(null)
  useEffect(() => () => stopRef.current?.(), [])
  return (
    <>
      <div className="form-row">
        <label className="form-label">{label}</label>
        <select className="input select" value={value} onChange={(e) => onChange(e.target.value)}>
          {options.map((o) => (
            <option key={o.id} value={o.id}>{t(o.label)}</option>
          ))}
        </select>
        <button className="icon-btn" aria-label={t('Play')} onClick={() => { stopRef.current?.(); stopRef.current = previewSound(value, volume, isAfter) }}>
          <Icon name="play" />
        </button>
        <button className="icon-btn" aria-label={t('Stop')} onClick={() => stopRef.current?.()}>
          <Icon name="stop" />
        </button>
      </div>
      <div className="form-row">
        <label className="form-label">{t('Volume')}</label>
        <div className="slider-wrap">
          <input type="range" min="0" max="100" step="5" value={volume} onChange={(e) => onVolume(Number(e.target.value))} />
          <div className="slider-scale"><span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span></div>
        </div>
      </div>
    </>
  )
}

function Check({ checked, onChange, children, help }) {
  return (
    <label className="check" title={help}>
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{children}</span>
      {help && <span className="help-dot" title={help}>?</span>}
    </label>
  )
}

export default function CustomizeDialog() {
  const { activeWheel, ws, updateSettings, updateWheel, closeDialog, t } = useApp()
  const [tab, setTab] = useState('during')
  const [d, setD] = useState(() => ({ ...activeWheel.settings, colors: activeWheel.settings.colors.map((c) => ({ ...c })) }))
  const [applyAll, setApplyAll] = useState(false)
  const [picker, setPicker] = useState(null)
  const set = (patch) => setD((x) => ({ ...x, ...patch }))
  const entriesCount = activeWheel.entries.length

  const save = () => {
    if (applyAll) ws.wheels.forEach((_, i) => updateSettings(i, d))
    else updateSettings(ws.active, d)
    closeDialog()
  }

  const setColor = (i, patch) => set({ colors: d.colors.map((c, k) => (k === i ? { ...c, ...patch } : c)) })

  return (
    <Modal onClose={closeDialog} wide className="customize-modal" hideClose footer={
      <>
        {ws.wheels.length > 1 && (
          <label className="check small grow">
            <input type="checkbox" checked={applyAll} onChange={(e) => setApplyAll(e.target.checked)} /> {t('Apply to all wheels')}
          </label>
        )}
        <button className="btn btn-text" onClick={closeDialog}>{t('Cancel')}</button>
        <button className="btn btn-primary" onClick={save}>{t('OK')}</button>
      </>
    }>
      <div className="tabs tabs-center">
        <button className={`tab ${tab === 'during' ? 'active' : ''}`} onClick={() => setTab('during')}>{t('During spin')}</button>
        <button className={`tab ${tab === 'after' ? 'active' : ''}`} onClick={() => setTab('after')}>{t('After spin')}</button>
        <button className={`tab ${tab === 'appearance' ? 'active' : ''}`} onClick={() => setTab('appearance')}>{t('Appearance')}</button>
      </div>

      <div className="settings-pane">
        {tab === 'during' && (
          <>
            <SoundRow t={t} label={t('Sound')} value={d.sound} volume={d.volume} options={SOUNDS_DURING} onChange={(v) => set({ sound: v })} onVolume={(v) => set({ volume: v })} />
            <hr />
            <div className="check-row">
              <Check checked={d.displayDuplicates} onChange={(v) => set({ displayDuplicates: v })} help={t('When off, identical entries are shown as one slice. Their combined chance stays the same.')}>{t('Display duplicates')}</Check>
              <Check checked={d.spinSlowly} onChange={(v) => set({ spinSlowly: v })}>{t('Spin slowly')}</Check>
              <Check checked={d.showTitle} onChange={(v) => set({ showTitle: v })}>{t('Show title')}</Check>
            </div>
            <hr />
            <div className="form-block">
              <label className="form-label">{t('Spin time (seconds)')}: <b>{d.spinTime}</b></label>
              <input type="range" min="1" max="60" value={d.spinTime} onChange={(e) => set({ spinTime: Number(e.target.value) })} />
              <div className="slider-scale"><span>1</span><span>10</span><span>20</span><span>30</span><span>40</span><span>50</span><span>60</span></div>
            </div>
            <hr />
            <div className="form-block">
              <label className="form-label strong">{t('Max number of names visible on the wheel')}: <b>{d.maxNames}</b></label>
              <p className="muted small">{t('All names in the text-box have the same chance of winning, regardless of this value.')}</p>
              <input type="range" min="4" max="1000" step="1" value={Math.min(d.maxNames, 1000)} onChange={(e) => set({ maxNames: Number(e.target.value) })} />
              {entriesCount > d.maxNames && <p className="muted small">{t('Showing')} {d.maxNames} / {entriesCount}</p>}
            </div>
          </>
        )}

        {tab === 'after' && (
          <>
            <SoundRow t={t} isAfter label={t('Sound')} value={d.afterSound} volume={d.afterVolume} options={SOUNDS_AFTER} onChange={(v) => set({ afterSound: v })} onVolume={(v) => set({ afterVolume: v })} />
            <hr />
            <div className="check-row">
              <Check checked={d.animateWinner} onChange={(v) => set({ animateWinner: v })}>{t('Animate winning entry')}</Check>
              <Check checked={d.confetti} onChange={(v) => set({ confetti: v })}>{t('Launch confetti')}</Check>
              <Check checked={d.autoRemove} onChange={(v) => set({ autoRemove: v })}>{t('Auto-remove winner after 5 seconds')}</Check>
            </div>
            <hr />
            <div className="form-row">
              <Check checked={d.showPopup} onChange={(v) => set({ showPopup: v })}>{t('Display popup with message:')}</Check>
              <input className="input grow" value={d.popupMessage} maxLength={200} disabled={!d.showPopup} onChange={(e) => set({ popupMessage: e.target.value })} />
            </div>
            <div className="indent">
              <Check checked={d.showRemove} onChange={(v) => set({ showRemove: v })}>{t('Display the "Remove" button')}</Check>
            </div>
            <Check checked={d.clickOnRemove} onChange={(v) => set({ clickOnRemove: v })}>{t('Play a click sound when the winner is removed')}</Check>
          </>
        )}

        {tab === 'appearance' && (
          <>
            <div className="mode-toggle">
              <button className={`mode-opt ${d.colorMode !== 'image' ? 'active' : ''}`} onClick={() => set({ colorMode: 'colors' })}>
                <span className="mode-icon mode-colors" />
                {t('One color per section')}
              </button>
              <button
                className={`switch ${d.colorMode === 'image' ? 'on' : ''}`}
                aria-label={t('Toggle wheel background image')}
                onClick={() => set({ colorMode: d.colorMode === 'image' ? 'colors' : 'image' })}
              />
              <button className={`mode-opt ${d.colorMode === 'image' ? 'active' : ''}`} onClick={() => { set({ colorMode: 'image' }); if (!d.bgImage) setPicker('bgImage') }}>
                <span className="mode-icon" style={d.bgImage ? { backgroundImage: `url("${d.bgImage}")` } : undefined}>{!d.bgImage && <Icon name="image" />}</span>
                {t('Wheel background image')}
              </button>
            </div>
            {d.colorMode === 'image' && (
              <div className="center">
                <button className="btn btn-soft" onClick={() => setPicker('bgImage')}><Icon name="image" size={16} /> {d.bgImage ? t('Change image') : t('Choose image')}</button>
              </div>
            )}
            <hr />
            {d.colorMode !== 'image' && (
              <>
                <Menu
                  align="left"
                  button={({ toggle }) => (
                    <button className="btn btn-primary" onClick={toggle}>{t('Apply a theme')} <Icon name="down" size={16} /></button>
                  )}
                  items={THEMES.map((th) => ({
                    label: th.name,
                    icon: <span className="theme-swatch">{th.colors.slice(0, 6).map((c) => <i key={c} style={{ background: c }} />)}</span>,
                    onClick: () => set({ colors: toColorSlots(th.colors) }),
                  }))}
                />
                <div className="form-label mt">{t('Customize colors')} <span className="help-dot" title={t('Tick the colors to use. Slices cycle through the ticked colors.')}>?</span></div>
                <div className="color-slots">
                  {d.colors.map((c, i) => (
                    <div key={i} className="color-slot">
                      <input type="checkbox" checked={c.enabled} onChange={(e) => setColor(i, { enabled: e.target.checked })} aria-label={`${t('Color')} ${i + 1}`} />
                      <label className="color-btn" style={{ background: c.color }}>
                        <Icon name="palette" size={18} />
                        <input type="color" value={c.color} onChange={(e) => setColor(i, { color: e.target.value, enabled: true })} />
                      </label>
                    </div>
                  ))}
                </div>
                <hr />
              </>
            )}
            <div className="form-row wrap">
              <label className="form-label">{t('Image at the center of the wheel')}</label>
              <button className="btn btn-primary img-btn" onClick={() => setPicker('centerImage')}>
                {d.centerImage ? <img src={d.centerImage} alt="" /> : <Icon name="image" />}
              </button>
              {d.centerImage && <button className="btn btn-text small" onClick={() => set({ centerImage: '' })}>{t('Remove')}</button>}
              <label className="form-label">{t('Image size')}</label>
              <select className="input select sm" value={d.centerSize} onChange={(e) => set({ centerSize: e.target.value })}>
                {['S', 'M', 'L', 'XL'].map((s) => <option key={s}>{s}</option>)}
              </select>
              {!d.centerImage && (
                <>
                  <label className="form-label">{t('Center text')}</label>
                  <input className="input sm" style={{ width: 110 }} maxLength={12} value={d.centerText ?? 'SPIN'} placeholder={t('none')} onChange={(e) => set({ centerText: e.target.value })} />
                </>
              )}
            </div>
            <div className="form-row wrap">
              <label className="form-label">{t('Text size')}</label>
              <select className="input select sm" value={String(d.textScale ?? 1)} onChange={(e) => set({ textScale: Number(e.target.value) })}>
                {[['0.8', t('Small')], ['1', t('Normal')], ['1.4', t('Large')], ['2', t('Extra large')]].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <Check checked={!!d.boldText} onChange={(v) => set({ boldText: v })}>{t('Bold text')}</Check>
            </div>
            <hr />
            <div className="check-row">
              <Check checked={d.pageGradient} onChange={(v) => set({ pageGradient: v })}>{t('Display a color gradient on the page')}</Check>
              <Check checked={d.shadow} onChange={(v) => set({ shadow: v })}>{t('Drop shadow')}</Check>
              <Check checked={d.contours} onChange={(v) => set({ contours: v })}>{t('Display contours')}</Check>
            </div>
            <div className="form-row wrap">
              <label className="form-label">{t('Pointer color')}</label>
              <input type="color" value={d.pointerColor || '#5546c9'} onChange={(e) => set({ pointerColor: e.target.value })} />
              {d.pointerColor ? <button className="btn btn-text small" onClick={() => set({ pointerColor: '' })}>{t('Auto')}</button> : <span className="muted small">{t('Auto: matches the slice')}</span>}
              <label className="form-label">{t('Text color')}</label>
              <input type="color" value={d.textColor || '#222222'} onChange={(e) => set({ textColor: e.target.value })} />
              {d.textColor && <button className="btn btn-text small" onClick={() => set({ textColor: '' })}>{t('Auto')}</button>}
            </div>
            <div className="form-row wrap">
              <label className="form-label">{t('Page background')}</label>
              <input type="color" value={d.pageBgColor || '#ffffff'} onChange={(e) => set({ pageBgColor: e.target.value })} />
              {d.pageBgColor && <button className="btn btn-text small" onClick={() => set({ pageBgColor: '' })}>{t('Reset')}</button>}
              <button className="btn btn-soft small" onClick={() => setPicker('pageBgImage')}><Icon name="image" size={16} /> {t('Background image')}</button>
              {d.pageBgImage && <button className="btn btn-text small" onClick={() => set({ pageBgImage: '' })}>{t('Remove')}</button>}
            </div>
            <div className="form-row">
              <label className="form-label">{t('Wheel title')}</label>
              <input className="input grow" value={activeWheel.title} maxLength={150} onChange={(e) => updateWheel(ws.active, { title: e.target.value })} />
            </div>
          </>
        )}
      </div>

      {picker && (
        <ImagePickerDialog
          allowRemove={!!d[picker]}
          onClose={() => setPicker(null)}
          onPick={(url) => set({ [picker]: url || '', ...(picker === 'bgImage' ? { colorMode: url ? 'image' : 'colors' } : {}) })}
        />
      )}
    </Modal>
  )
}
