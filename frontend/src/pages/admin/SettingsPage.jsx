import { useEffect, useRef, useState } from 'react'
import { useApp } from '../../store/AppStore'
import { api } from '../../lib/api'
import { LANGUAGES } from '../../i18n'
import { Field, PageHead, Toggle, useResource } from './common'
import Icon from '../../components/Icon'

function AssetUpload({ label, k, value, onUploaded, help }) {
  const ref = useRef(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const upload = async (file) => {
    if (!file) return
    setBusy(true)
    setErr('')
    const fd = new FormData()
    fd.append('key', k)
    fd.append('file', file)
    try {
      const r = await api.upload('/admin/settings/asset', fd)
      onUploaded(r.url)
    } catch (e) {
      setErr(e.message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <Field label={label} help={err || help}>
      <div className="asset-row">
        <div className="asset-preview">{value ? <img src={value} alt="" /> : <span className="muted small">none</span>}</div>
        <button type="button" className="btn btn-soft small" onClick={() => ref.current?.click()} disabled={busy}>
          <Icon name="upload" size={15} /> {busy ? 'Uploading…' : 'Upload'}
        </button>
        <input ref={ref} type="file" hidden accept="image/*,.svg,.ico" onChange={(e) => upload(e.target.files?.[0])} />
      </div>
    </Field>
  )
}

const AD_PLACES = [
  ['wheel', 'Beside the wheel', 'Home, game & shared wheel pages'],
  ['tool', 'Inside page content', 'Between the info cards below the wheel'],
  ['team', 'Team Picker', 'Above the Team Picker guide'],
  ['blog_list', 'Blog list', 'Below the featured article'],
  ['blog_post', 'Blog articles', 'At the end of each article'],
]

const SECTIONS = ['Branding', 'Wheel defaults', 'Home page', 'Ads', 'SEO & tracking', 'Features', 'Integrations']

export default function SettingsPage() {
  const { setBoot, toast } = useApp()
  const [{ data, error }] = useResource('/admin/settings')
  const [s, setS] = useState(null)
  const [section, setSection] = useState('Branding')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    if (data) setS({ ...data })
  }, [data])
  if (error) return <div className="alert error">{error}</div>
  if (!s) return <p className="muted">Loading…</p>

  const set = (k) => (e) => setS((x) => ({ ...x, [k]: e?.target ? (e.target.type === 'checkbox' ? (e.target.checked ? '1' : '0') : e.target.value) : e }))
  const flag = (k) => (v) => setS((x) => ({ ...x, [k]: v ? '1' : '0' }))
  const text = (k, label, help, props = {}) => (
    <Field label={label} help={help}><input className="input" value={s[k] ?? ''} onChange={set(k)} {...props} /></Field>
  )
  const area = (k, label, help, rows = 4, wide = true) => (
    <Field label={label} help={help} wide={wide}><textarea className="input mono" rows={rows} value={s[k] ?? ''} onChange={set(k)} /></Field>
  )
  const color = (k, label) => (
    <Field label={label}>
      <div className="row">
        <input type="color" value={s[k] || '#000000'} onChange={set(k)} />
        <input className="input mono sm" value={s[k] || ''} onChange={set(k)} />
      </div>
    </Field>
  )

  const refreshBoot = () => api.get('/bootstrap?t=' + Date.now()).then((b) => setBoot((old) => ({ ...old, ...b, loaded: true }))).catch(() => {})

  const save = async () => {
    setSaving(true)
    setMsg('')
    try {
      await api.put('/admin/settings', { settings: s })
      await refreshBoot()
      toast('Settings saved')
      setMsg('Saved. Changes are live on the site.')
    } catch (e) {
      setMsg(e.message)
    } finally {
      setSaving(false)
    }
  }

  const defaultColors = (s.default_colors || '').split(',').map((c) => c.trim()).filter(Boolean)
  const langs = (s.enabled_languages || 'en').split(',').map((x) => x.trim())

  return (
    <>
      <PageHead title="Branding & settings">
        <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save settings'}</button>
      </PageHead>
      {msg && <div className="alert">{msg}</div>}
      <div className="tabs tabs-left">
        {SECTIONS.map((x) => <button key={x} className={`tab ${section === x ? 'active' : ''}`} onClick={() => setSection(x)}>{x}</button>)}
      </div>
      <div className="card form-grid">
        {section === 'Branding' && (
          <>
            {text('site_name', 'Site name', 'Shown in titles, emails and the footer.')}
            {text('tagline', 'Tagline')}
            <AssetUpload label="Logo" k="logo_url" value={s.logo_url} help="PNG/SVG/WEBP, transparent background recommended. Wide logos work best." onUploaded={(u) => { setS((x) => ({ ...x, logo_url: u })); refreshBoot() }} />
            <AssetUpload label="Logo for dark mode (optional)" k="logo_dark_url" value={s.logo_dark_url} onUploaded={(u) => { setS((x) => ({ ...x, logo_dark_url: u })); refreshBoot() }} />
            {text('logo_height', 'Logo height (px)', 'Toolbar logo height, e.g. 44', { type: 'number', min: 20, max: 120 })}
            <AssetUpload label="Favicon / app icon" k="favicon_url" value={s.favicon_url} help="Square PNG, 192×192 or larger. Also used as the card icon on the home page." onUploaded={(u) => { setS((x) => ({ ...x, favicon_url: u })); refreshBoot() }} />
            {color('primary_color', 'Primary color (buttons, active tabs)')}
            {color('secondary_color', 'Secondary color')}
            {color('accent_color', 'Accent color')}
            {color('page_bg_from', 'Page gradient – start')}
            {color('page_bg_to', 'Page gradient – end')}
            {text('font_family', 'Wheel font (Google Font name)', 'e.g. Quicksand, Poppins, Nunito')}
            {text('copyright', 'Footer copyright', '{year} is replaced with the current year.')}
            {text('contact_email', 'Contact email', '', { type: 'email' })}
            {text('version', 'Version label', 'Shown under the entries panel.')}
          </>
        )}
        {section === 'Wheel defaults' && (
          <>
            {area('default_entries', 'Default entries for new visitors', 'One per line.', 8, false)}
            <Field label="Default colors" help="Slices cycle through these colors.">
              <div className="row wrap">
                {defaultColors.map((c, i) => (
                  <span key={i} className="color-chip">
                    <input type="color" value={c} onChange={(e) => setS((x) => ({ ...x, default_colors: defaultColors.map((cc, k) => (k === i ? e.target.value : cc)).join(',') }))} />
                    <button type="button" className="mini-x" onClick={() => setS((x) => ({ ...x, default_colors: defaultColors.filter((_, k) => k !== i).join(',') }))}>×</button>
                  </span>
                ))}
                {defaultColors.length < 6 && <button type="button" className="btn btn-soft small" onClick={() => setS((x) => ({ ...x, default_colors: [...defaultColors, '#888888'].join(',') }))}>+ Add</button>}
              </div>
            </Field>
            {text('default_spin_time', 'Default spin time (seconds)', '', { type: 'number', min: 1, max: 60 })}
            {text('default_popup_message', 'Default winner message')}
          </>
        )}
        {section === 'Home page' && (
          <>
            <Toggle checked={s.show_info_cards === '1'} onChange={flag('show_info_cards')} label="Show information cards below the wheel" />
            <Toggle checked={s.show_stats === '1'} onChange={flag('show_stats')} label='Show "Activity" spin counter' />
            {text('stats_offset_spins', 'Spin counter starting offset', 'Added to the real count (e.g. spins from the old site).', { type: 'number', min: 0 })}
            {text('stats_offset_hours', 'Hours counter starting offset', '', { type: 'number', min: 0 })}
            {text('gallery_tags', 'Gallery quick-search tags', 'Comma separated.')}
          </>
        )}
        {section === 'Ads' && (
          <>
            <Toggle checked={s.ads_enabled === '1'} onChange={flag('ads_enabled')} label="Show ads on the website" />

            <div className="ads-sub">Google AdSense</div>
            {text('adsense_client', 'AdSense publisher ID', 'From AdSense → Account → Account information, e.g. ca-pub-1234567890123456. Loads AdSense on every public page (needed for site approval and Auto ads) and fills ads.txt automatically.', { placeholder: 'ca-pub-0000000000000000' })}
            <div className="ads-note">
              <Icon name="check" size={16} />
              <span>
                Your ads.txt: <a href="/ads.txt" target="_blank" rel="noreferrer">{window.location.origin}/ads.txt</a> — open it after saving to confirm the
                <code>google.com, pub-…, DIRECT</code> line. For European/UK visitors turn on Google’s consent message in
                AdSense → <b>Privacy &amp; messaging</b> (no code needed).
              </span>
            </div>

            <div className="ads-sub">Where ads appear</div>
            <div className="ads-places">
              {AD_PLACES.map(([k, label, help]) => {
                const list = (s.ad_places ?? '').split(',').filter(Boolean)
                const on = list.includes(k)
                return (
                  <label key={k} className={`ads-place ${on ? 'on' : ''}`}>
                    <input type="checkbox" checked={on} onChange={() => setS((x) => {
                      const cur = (x.ad_places ?? '').split(',').filter(Boolean)
                      return { ...x, ad_places: (on ? cur.filter((c) => c !== k) : [...cur, k]).join(',') }
                    })} />
                    <span><b>{label}</b><small>{help}</small></span>
                  </label>
                )
              })}
            </div>

            <div className="ads-sub">Ad unit codes</div>
            {area('ad_code', 'Beside-the-wheel ad (desktop)', 'Paste the AdSense ad unit code (the <ins class="adsbygoogle"> block with its <script>). A 300×250 or 300×600 unit fits best.', 6)}
            {area('ad_code_mobile', 'Beside-the-wheel ad (mobile, optional)', 'Used on screens narrower than 760px. A responsive or 320×100 unit works well.', 4)}
            {area('ad_code_content', 'In-content ad (blog, Team Picker, game pages)', 'A responsive / in-article unit. If empty, the desktop code above is used.', 5)}

            <div className="ads-sub">Options</div>
            <Toggle checked={s.ads_closable !== '0'} onChange={flag('ads_closable')} label='Let visitors hide ads with "Close ads" for their visit' />
            {text('ad_report_email', '"Report bad ad" email')}
            {area('ads_txt', 'Extra ads.txt lines (other ad networks)', 'One line per network, e.g. from Ezoic, Media.net. The AdSense line is added automatically.', 3)}
          </>
        )}
        {section === 'SEO & tracking' && (
          <>
            {text('meta_title', 'Home page title')}
            {area('meta_description', 'Home page meta description', '150–160 characters works best.', 3)}
            <AssetUpload label="Social share image (og:image)" k="og_image" value={s.og_image} help="1200×630 recommended." onUploaded={(u) => setS((x) => ({ ...x, og_image: u }))} />
            {text('google_analytics_id', 'Google Analytics 4 ID', 'e.g. G-XXXXXXXXXX')}
            {area('custom_head_html', 'Custom <head> HTML', 'Verification tags, pixels, etc. Injected on every page.', 4)}
            {area('custom_css', 'Custom CSS', 'Fine-tune the look without rebuilding.', 6)}
          </>
        )}
        {section === 'Features' && (
          <>
            <Toggle checked={s.allow_registration === '1'} onChange={flag('allow_registration')} label="Allow new account sign-ups" />
            <Toggle checked={s.allow_gallery === '1'} onChange={flag('allow_gallery')} label="Allow publishing wheels to the public gallery" />
            <Toggle checked={s.allow_uploads === '1'} onChange={flag('allow_uploads')} label="Allow visitors to upload images" />
            <Field label="Languages offered" wide>
              <div className="lang-checks">
                {LANGUAGES.map((l) => (
                  <label key={l.code} className="check small">
                    <input type="checkbox" checked={langs.includes(l.code)} disabled={l.code === 'en'} onChange={(e) => {
                      const next = e.target.checked ? [...langs, l.code] : langs.filter((x) => x !== l.code)
                      setS((x) => ({ ...x, enabled_languages: Array.from(new Set(['en', ...next])).join(',') }))
                    }} /> {l.name} <span className="muted">({l.english})</span>
                  </label>
                ))}
              </div>
            </Field>
          </>
        )}
        {section === 'Integrations' && (
          <>
            {text('unsplash_access_key', 'Unsplash Access Key', 'Enables image search in the image picker. Free at unsplash.com/developers. Never sent to browsers.')}
            {text('feedback_notify_email', 'Email new feedback to', 'Requires MAIL_* settings in .env')}
          </>
        )}
      </div>
    </>
  )
}
