import { useEffect, useState } from 'react'
import { useApp } from '../../store/AppStore'
import { api } from '../../lib/api'
import { Field, PageHead, Toggle, useResource } from './common'
import Icon from '../../components/Icon'

/**
 * Admin -> Team Picker
 * Page text, SEO and the starting values a new visitor sees (also what the "Reset" button restores).
 * Values are stored in Branding & settings (tp_* keys) and are live as soon as they are saved.
 */
const KEYS = [
  'tp_heading', 'tp_subheading', 'tp_default_names', 'tp_default_mode', 'tp_default_teams', 'tp_default_size',
  'tp_default_leader', 'tp_default_balance', 'tp_default_animate', 'tp_default_sound', 'tp_default_team_names',
  'tp_show_guide', 'tp_meta_title', 'tp_meta_description',
]

export default function TeamPickerPage() {
  const { setBoot, toast } = useApp()
  const [{ data, error }] = useResource('/admin/settings')
  const [s, setS] = useState(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    if (data) setS(Object.fromEntries(KEYS.map((k) => [k, data[k] ?? ''])))
  }, [data])
  if (error) return <div className="alert error">{error}</div>
  if (!s) return <p className="muted">Loading…</p>

  const set = (k) => (e) => setS((x) => ({ ...x, [k]: e.target.value }))
  const flag = (k) => (v) => setS((x) => ({ ...x, [k]: v ? '1' : '0' }))
  const names = (s.tp_default_names || '').split(/\r?\n/).filter((l) => l.trim())

  const save = async () => {
    setSaving(true)
    setMsg('')
    try {
      await api.put('/admin/settings', { settings: s })
      const b = await api.get('/bootstrap?t=' + Date.now())
      setBoot((old) => ({ ...old, ...b, loaded: true }))
      toast('Team Picker saved')
      setMsg('Saved. New visitors and the Reset button now use these values.')
    } catch (e) {
      setMsg(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHead title="Team Picker">
        <a className="btn btn-soft" href="/team-picker" target="_blank" rel="noreferrer"><Icon name="external" size={16} /> Open page</a>
        <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
      </PageHead>
      {msg && <div className="alert">{msg}</div>}

      <div className="card form-grid">
        <div className="ads-sub field-wide">Page text</div>
        <Field label="Heading (H1)"><input className="input" value={s.tp_heading} onChange={set('tp_heading')} /></Field>
        <Field label="Sub-heading"><input className="input" value={s.tp_subheading} onChange={set('tp_subheading')} /></Field>
        <Toggle checked={s.tp_show_guide !== '0'} onChange={flag('tp_show_guide')} label="Show the guide, FAQ and tool links below the Team Picker" />

        <div className="ads-sub field-wide">Default names & settings</div>
        <Field label={`Default names (${names.length})`} help="One name per line. New visitors see these, and the Reset button brings them back. Add a label after a comma for balancing, e.g. “Amelia, girl”." wide>
          <textarea className="input mono" rows={8} value={s.tp_default_names} onChange={set('tp_default_names')} />
        </Field>
        <Field label="Split by">
          <select className="input" value={s.tp_default_mode} onChange={set('tp_default_mode')}>
            <option value="teams">Number of teams</option>
            <option value="size">Members per team</option>
          </select>
        </Field>
        {s.tp_default_mode === 'size'
          ? <Field label="Members per team"><input className="input" type="number" min="1" max="100" value={s.tp_default_size} onChange={set('tp_default_size')} /></Field>
          : <Field label="Number of teams"><input className="input" type="number" min="1" max="100" value={s.tp_default_teams} onChange={set('tp_default_teams')} /></Field>}
        <Field label="Default team names (optional)" help="One per line, e.g. Red, Blue, Green. Leave empty for Team 1, Team 2…" wide>
          <textarea className="input mono" rows={3} value={s.tp_default_team_names} onChange={set('tp_default_team_names')} />
        </Field>
        <Toggle checked={s.tp_default_leader === '1'} onChange={flag('tp_default_leader')} label="Pick a team leader" />
        <Toggle checked={s.tp_default_balance === '1'} onChange={flag('tp_default_balance')} label="Balance teams by label (gender, skill…)" />
        <Toggle checked={s.tp_default_animate !== '0'} onChange={flag('tp_default_animate')} label="Animate the draw" />
        <Toggle checked={s.tp_default_sound !== '0'} onChange={flag('tp_default_sound')} label="Sound" />
        <p className="muted small field-wide">Visitors who already changed their own list keep it until they press <b>Reset</b>.</p>

        <div className="ads-sub field-wide">SEO</div>
        <Field label="Page title" help="{site} is replaced with the site name. About 50–60 characters." wide>
          <input className="input" value={s.tp_meta_title} onChange={set('tp_meta_title')} />
        </Field>
        <Field label={`Meta description (${(s.tp_meta_description || '').length} characters)`} help="Shown in Google results. About 140–160 characters." wide>
          <textarea className="input" rows={3} value={s.tp_meta_description} onChange={set('tp_meta_description')} />
        </Field>
        <p className="muted small field-wide">Ads on this page: Branding &amp; settings → Ads → “Team Picker”.</p>
      </div>
    </>
  )
}
