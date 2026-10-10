import { useApp } from '../../store/AppStore'
import Modal from '../Modal'

export default function PreferencesDialog() {
  const { prefs, setPrefs, closeDialog, t } = useApp()
  const row = (key, label, help) => (
    <label className="pref-row">
      <span>
        <strong>{label}</strong>
        {help && <span className="muted small block">{help}</span>}
      </span>
      <input type="checkbox" className="toggle" checked={!!prefs[key]} onChange={(e) => setPrefs({ [key]: e.target.checked })} />
    </label>
  )
  return (
    <Modal title={t('Preferences')} onClose={closeDialog} footer={<button className="btn btn-primary" onClick={closeDialog}>{t('Done')}</button>}>
      {row('dark', t('Dark mode'), t('Easier on the eyes at night.'))}
      {row('idleSpin', t('Slowly rotate the wheel when idle'))}
      {row('reduceMotion', t('Reduce motion'), t('Turns off confetti and idle animation.'))}
      <p className="muted small">{t('Preferences are stored in this browser only.')}</p>
    </Modal>
  )
}
