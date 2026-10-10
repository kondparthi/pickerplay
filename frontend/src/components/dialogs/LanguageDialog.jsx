import { useState } from 'react'
import { useApp } from '../../store/AppStore'
import { LANGUAGES } from '../../i18n'
import Modal from '../Modal'
import Icon from '../Icon'

export default function LanguageDialog() {
  const { closeDialog, setPrefs, lang, site, t } = useApp()
  const [q, setQ] = useState('')
  const enabled = (site.enabled_languages || 'en').split(',').map((s) => s.trim())
  const list = LANGUAGES.filter((l) => enabled.includes(l.code))
  const filtered = list.filter((l) => !q || (l.name + ' ' + l.english).toLowerCase().includes(q.toLowerCase()))
  return (
    <Modal title={<><Icon name="globe" /> {t('Language')}</>} onClose={closeDialog} wide>
      <input className="input" placeholder={t('Search')} value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="lang-grid">
        {filtered.map((l) => (
          <button key={l.code} className={`lang-item ${l.code === lang ? 'active' : ''}`} onClick={() => { setPrefs({ lang: l.code }); closeDialog() }}>
            {l.name}
            <span className="muted small">{l.english}</span>
          </button>
        ))}
      </div>
    </Modal>
  )
}
