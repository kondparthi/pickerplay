import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import QRCode from 'qrcode'
import confetti from 'canvas-confetti'
import { useApp } from '../store/AppStore'
import { api } from '../lib/api'
import { store } from '../lib/storage'
import { uid } from '../lib/random'
import { contrastText } from '../lib/colors'
import { defaultSettings } from '../lib/defaults'
import Toolbar from '../components/Toolbar'
import Footer from '../components/Footer'
import Icon from '../components/Icon'
import Wheel from '../components/Wheel'
import NotFound from './NotFound'
import '../poll.css'

/* ------------------------------------------------------------------ helpers */
const COLORS = ['#9cd60c', '#ff3269', '#fee20a', '#7c5afe', '#31c0ff', '#fb8c00', '#00b894', '#e84393', '#0984e3', '#fdcb6e', '#6c5ce7', '#d63031']
const MY_POLLS = 'pp.mypolls'
const PRESETS = [
  ['Yes / No / Maybe', ['Yes', 'No', 'Maybe']],
  ['Yes / No', ['Yes', 'No']],
  ['Agree scale', ['Strongly agree', 'Agree', 'Neutral', 'Disagree', 'Strongly disagree']],
  ['Rating 1–5', ['⭐ 1', '⭐⭐ 2', '⭐⭐⭐ 3', '⭐⭐⭐⭐ 4', '⭐⭐⭐⭐⭐ 5']],
  ['Days', ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']],
]

export function deviceId() {
  let id = store.get('pp.device')
  if (!id) {
    id = uid('d') + uid('')
    store.set('pp.device', id)
  }
  return id
}
const myPolls = () => store.get(MY_POLLS, [])
const rememberPoll = (p) => store.set(MY_POLLS, [p, ...myPolls().filter((x) => x.code !== p.code)].slice(0, 50))
const forgetPoll = (code) => store.set(MY_POLLS, myPolls().filter((x) => x.code !== code))
const pollUrl = (code) => `${window.location.origin}/poll/${code}`
const resultsUrl = (code, key) => `${window.location.origin}/poll/${code}/results#key=${key}`

/** Wheel config from poll options; weights = votes when results are given. */
function pollWheel(options, site, { results, centerText = 'VOTE' } = {}) {
  const counts = Object.fromEntries((results?.options || []).map((o) => [o.id, o.votes]))
  const anyVotes = results && results.total > 0
  return {
    id: 'poll',
    title: '',
    entries: options.filter((o) => (o.text || '').trim()).map((o) => ({
      id: String(o.id), text: o.text, color: o.color, enabled: true,
      weight: anyVotes ? counts[o.id] || 0 : 1,
    })),
    settings: { ...defaultSettings(site), centerText, centerSize: 'M', spinTime: 6, showTitle: false, textScale: 1.1, boldText: true },
  }
}

function Card({ title, children }) {
  const { site } = useApp()
  return (
    <article className="info-card card">
      <h2>{site.favicon_url && <img src={site.favicon_url} alt="" className="info-icon" />}{title}</h2>
      {children}
    </article>
  )
}

function Qr({ text, size = 168 }) {
  const [src, setSrc] = useState('')
  useEffect(() => {
    QRCode.toDataURL(text, { width: size * 2, margin: 1, color: { dark: '#1b1b2b', light: '#ffffff' } }).then(setSrc).catch(() => setSrc(''))
  }, [text, size])
  return src ? <img className="pl-qr" src={src} width={size} height={size} alt="QR code for the poll link" /> : <div className="pl-qr" style={{ width: size, height: size }} />
}

function ShareBox({ code, adminKey }) {
  const { t, toast } = useApp()
  const url = pollUrl(code)
  const copy = (v, msg) => navigator.clipboard?.writeText(v).then(() => toast(msg))
  const text = encodeURIComponent(`${t('Please vote in this poll')}: ${url}`)
  return (
    <div className="pl-share">
      <div className="pl-share-main">
        <label className="pl-label">{t('Share this link – everyone votes from it')}</label>
        <div className="pl-link">
          <input readOnly value={url} onFocus={(e) => e.target.select()} />
          <button className="btn btn-primary" onClick={() => copy(url, t('Link copied'))}><Icon name="copy" size={16} /> {t('Copy')}</button>
        </div>
        <div className="pl-share-btns">
          <a className="chip-btn" href={`https://wa.me/?text=${text}`} target="_blank" rel="noreferrer">WhatsApp</a>
          <a className="chip-btn" href={`mailto:?subject=${encodeURIComponent(t('Quick poll'))}&body=${text}`}>{t('Email')}</a>
          <a className="chip-btn" href={`https://teams.microsoft.com/share?href=${encodeURIComponent(url)}`} target="_blank" rel="noreferrer">MS Teams</a>
          <a className="chip-btn" href={url} target="_blank" rel="noreferrer"><Icon name="external" size={15} /> {t('Open voting page')}</a>
        </div>
        {adminKey && (
          <div className="pl-private">
            <Icon name="lock" size={16} />
            <div>
              <b>{t('Your private results link')}</b>
              <span>{t('Only people with this link can see live results and close the poll. It is also saved in this browser under “My polls”.')}</span>
              <button className="linkish" onClick={() => copy(resultsUrl(code, adminKey), t('Results link copied'))}>{t('Copy results link')}</button>
            </div>
          </div>
        )}
      </div>
      <div className="pl-share-qr">
        <Qr text={url} />
        <span className="muted small">{t('Scan to vote')}</span>
      </div>
    </div>
  )
}

function ResultBars({ results, myVote }) {
  const { t } = useApp()
  if (!results) return null
  const max = Math.max(1, ...results.options.map((o) => o.votes))
  return (
    <ul className="pl-bars">
      {results.options.map((o) => (
        <li key={o.id} className={`${o.votes === max && results.total ? 'lead' : ''} ${myVote === o.id ? 'mine' : ''}`}>
          <div className="pl-bar-top">
            <span className="pl-dot" style={{ background: o.color }} />
            <b>{o.text}</b>
            {myVote === o.id && <em>{t('your vote')}</em>}
            <span className="pl-bar-num">{o.votes} · {o.percent}%</span>
          </div>
          <div className="pl-bar-track"><i style={{ width: `${o.percent}%`, background: o.color }} /></div>
        </li>
      ))}
      <li className="pl-total muted small">{results.total} {results.total === 1 ? t('vote') : t('votes')}</li>
    </ul>
  )
}

/* ------------------------------------------------------------------ create */
export function PollCreate() {
  const { t, site, toast } = useApp()
  const nav = useNavigate()
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(() => ['Yes', 'No', 'Maybe'].map((x, i) => ({ id: i + 1, text: x, color: COLORS[i] })))
  const [showResults, setShowResults] = useState(true)
  const [askName, setAskName] = useState(false)
  const [allowChange, setAllowChange] = useState(false)
  const [days, setDays] = useState(30)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [created, setCreated] = useState(null)
  const [mine, setMine] = useState(myPolls)

  useEffect(() => { document.title = `${t('Polling Wheel')} – ${t('Create a free online poll')} | ${site.site_name}` }, [site.site_name, t])

  const setOpt = (i, patch) => setOptions((o) => o.map((x, k) => (k === i ? { ...x, ...patch } : x)))
  const addOpt = () => options.length < 12 && setOptions((o) => [...o, { id: Date.now(), text: '', color: COLORS[o.length % COLORS.length] }])
  const delOpt = (i) => options.length > 2 && setOptions((o) => o.filter((_, k) => k !== i))
  const preset = (list) => setOptions(list.map((x, i) => ({ id: i + 1, text: x, color: COLORS[i % COLORS.length] })))
  const filled = options.filter((o) => o.text.trim())
  const preview = useMemo(() => pollWheel(filled.length ? filled : [{ id: 1, text: '?', color: COLORS[0] }], site), [options, site]) // eslint-disable-line

  const create = async (e) => {
    e.preventDefault()
    setError('')
    if (!question.trim()) return setError(t('Type your question first.'))
    if (filled.length < 2) return setError(t('Add at least two answers.'))
    setBusy(true)
    try {
      const r = await api.post('/polls', {
        question: question.trim(),
        options: filled.map((o) => ({ text: o.text.trim(), color: o.color })),
        settings: { show_results: showResults, ask_name: askName, allow_change: allowChange },
        days,
      })
      const rec = { code: r.data.code, key: r.key, question: r.data.question, created: new Date().toISOString() }
      rememberPoll(rec)
      setMine(myPolls())
      setCreated(rec)
      api.post('/stats/spin', { seconds: 1, path: '/polling-wheel' }).catch(() => {})
      confetti({ particleCount: 90, spread: 80, origin: { y: 0.4 }, colors: filled.map((o) => o.color), disableForReducedMotion: true })
      window.scrollTo({ top: 0, behavior: 'auto' })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="app">
      <Toolbar minimal />
      <main className="app-bg">
        <section className="pl-hero">
          <h1>🗳️ {t('Polling Wheel')}</h1>
          <p>{t('Ask a question, share one link, and watch every vote fill a live results wheel.')}</p>
        </section>

        {created ? (
          <section className="pl-wrap pl-done">
            <div className="card pl-card">
              <div className="pl-done-head">
                <span className="pl-check"><Icon name="check" size={22} /></span>
                <div>
                  <h2>{t('Your poll is live!')}</h2>
                  <p className="muted">“{created.question}”</p>
                </div>
              </div>
              <ShareBox code={created.code} adminKey={created.key} />
              <div className="row wrap pl-done-actions">
                <button className="btn btn-primary" onClick={() => nav(`/poll/${created.code}/results#key=${created.key}`)}><Icon name="chart" size={16} /> {t('See live results')}</button>
                <button className="btn btn-soft" onClick={() => { setCreated(null); setQuestion('') }}><Icon name="plus" size={16} /> {t('Create another poll')}</button>
              </div>
            </div>
          </section>
        ) : (
          <section className="pl-wrap">
            <form className="card pl-card pl-form" onSubmit={create}>
              <label className="pl-label" htmlFor="pl-q">{t('Your question')}</label>
              <input id="pl-q" className="input pl-q" value={question} maxLength={300} autoFocus placeholder={t('e.g. Shall we have the team lunch on Friday?')} onChange={(e) => setQuestion(e.target.value)} />

              <div className="pl-label-row">
                <label className="pl-label">{t('Answers')} <span className="muted small">({filled.length}/12)</span></label>
                <div className="pl-presets">
                  {PRESETS.map(([label, list]) => <button type="button" key={label} className="pl-preset" onClick={() => preset(list)}>{t(label)}</button>)}
                </div>
              </div>
              <ol className="pl-opts">
                {options.map((o, i) => (
                  <li key={o.id}>
                    <label className="pl-color" style={{ background: o.color }} title={t('Colour')}>
                      <input type="color" value={o.color} onChange={(e) => setOpt(i, { color: e.target.value })} />
                    </label>
                    <input className="input" value={o.text} maxLength={80} placeholder={`${t('Answer')} ${i + 1}`} onChange={(e) => setOpt(i, { text: e.target.value })} />
                    <button type="button" className="icon-btn" onClick={() => delOpt(i)} disabled={options.length <= 2} aria-label={t('Remove answer')}><Icon name="x" size={18} /></button>
                  </li>
                ))}
              </ol>
              {options.length < 12 && <button type="button" className="btn btn-soft small" onClick={addOpt}><Icon name="plus" size={15} /> {t('Add answer')}</button>}

              <div className="pl-settings">
                <label className="check"><input type="checkbox" checked={showResults} onChange={(e) => setShowResults(e.target.checked)} /> {t('Voters see the results after voting')}</label>
                <label className="check"><input type="checkbox" checked={askName} onChange={(e) => setAskName(e.target.checked)} /> {t('Ask voters for their name')}</label>
                <label className="check"><input type="checkbox" checked={allowChange} onChange={(e) => setAllowChange(e.target.checked)} /> {t('Voters can change their vote')}</label>
                <label className="pl-days">{t('Poll stays open for')}
                  <select className="input select sm" value={days} onChange={(e) => setDays(Number(e.target.value))}>
                    {[1, 3, 7, 14, 30, 90].map((d) => <option key={d} value={d}>{d} {d === 1 ? t('day') : t('days')}</option>)}
                  </select>
                </label>
              </div>

              {error && <div className="alert error">{error}</div>}
              <button className="btn tp-go pl-go" disabled={busy}><Icon name="share" /> {busy ? t('Creating…') : t('CREATE & SHARE POLL')}</button>
              <p className="muted small center">{t('One vote per phone or computer. No sign-up needed to vote.')}</p>
            </form>

            <aside className="card pl-card pl-preview">
              <div className="pl-label">{t('Preview')}</div>
              <h3 className="pl-preview-q">{question.trim() || t('Your question appears here')}</h3>
              <div className="pl-wheel"><Wheel wheel={preview} idle /></div>
              <div className="pl-vote-btns preview">
                {filled.map((o) => <span key={o.id} className="pl-vote-btn" style={{ '--c': o.color, color: contrastText(o.color) }}>{o.text}</span>)}
              </div>
            </aside>
          </section>
        )}

        {mine.length > 0 && (
          <section className="pl-wrap pl-mine-wrap">
            <div className="card pl-card pl-mine">
              <h3>{t('My polls')} <span className="muted small">({t('saved in this browser')})</span></h3>
              <ul>
                {mine.map((p) => (
                  <li key={p.code}>
                    <div><b>{p.question}</b><span className="muted small">{new Date(p.created).toLocaleDateString()} · /poll/{p.code}</span></div>
                    <Link className="btn btn-soft small" to={`/poll/${p.code}/results#key=${p.key}`}><Icon name="chart" size={15} /> {t('Results')}</Link>
                    <button className="icon-btn" title={t('Remove from this list')} onClick={() => { forgetPoll(p.code); setMine(myPolls()); toast(t('Removed from your list')) }}><Icon name="x" size={16} /></button>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}
      </main>
      <PollContent />
      <Footer />
    </div>
  )
}

function PollContent() {
  const { t } = useApp()
  return (
    <>
      <section className="tp-intro">
        <h2>{t('Polling Wheel – Free Online Poll Maker')}</h2>
        <p className="tp-lead">{t('Need a quick decision from the whole group?')}</p>
        <p>{t('Create a poll in seconds, send one link on WhatsApp, Teams, email or a QR code on the projector, and see the answers arrive live. The results wheel grows each answer’s slice as votes come in – and you can even spin it to settle a tie.')}</p>
      </section>
      <section className="info-grid">
        <Card title={t('How it works')}>
          <ol>
            <li>{t('Type your question and the answers (Yes, No, Maybe or your own).')}</li>
            <li>{t('Press Create & share poll and send the link or show the QR code.')}</li>
            <li>{t('Everyone taps their answer – one vote per phone or computer.')}</li>
            <li>{t('Open your private results link to watch the votes live.')}</li>
          </ol>
        </Card>
        <Card title={t('Corporate teams')}>
          <ul>
            <li>{t('Pick the date for the team outing or lunch')}</li>
            <li>{t('Quick pulse checks and stand-up questions')}</li>
            <li>{t('Vote on ideas in workshops and town halls')}</li>
          </ul>
        </Card>
        <Card title={t('Schools & classrooms')}>
          <ul>
            <li>{t('Exit tickets: “Did you understand today’s lesson?”')}</li>
            <li>{t('Let the class choose the next topic or game')}</li>
            <li>{t('Show the QR code on the board – no accounts needed')}</li>
          </ul>
        </Card>
        <Card title={t('College teams & clubs')}>
          <ul>
            <li>{t('Choose fest themes, event names and T-shirt colours')}</li>
            <li>{t('Pick meeting times for project groups')}</li>
            <li>{t('Run fair votes for club decisions')}</li>
          </ul>
        </Card>
        <Card title={t('Friends, family & groups')}>
          <ul>
            <li>{t('Where should we go this weekend?')}</li>
            <li>{t('Which movie tonight? Which restaurant?')}</li>
            <li>{t('Trip dates, gift ideas and party plans')}</li>
          </ul>
        </Card>
        <Card title={t('Fair and private')}>
          <p>{t('Each phone or computer can vote once. Only the person who created the poll has the results link, and can choose whether voters see results too. Ask for names only when you need them.')}</p>
        </Card>
      </section>
    </>
  )
}

/* ------------------------------------------------------------------ vote */
export function PollVote() {
  const { code } = useParams()
  const { t, site, toast } = useApp()
  const [state, setState] = useState({ status: 'loading' })
  const [name, setName] = useState(() => store.get('pp.voterName', ''))
  const [busy, setBusy] = useState(false)
  const [changing, setChanging] = useState(false)

  const load = useCallback(() => {
    api.get(`/polls/${code}?device=${encodeURIComponent(deviceId())}`)
      .then((r) => setState({ status: 'ok', poll: r.data, results: r.results || null, myVote: r.my_vote ?? null }))
      .catch((e) => setState({ status: e.status === 404 ? 'missing' : 'error', error: e.message }))
  }, [code])
  useEffect(load, [load])
  useEffect(() => { if (state.poll) document.title = `${state.poll.question} | ${site.site_name}` }, [state.poll, site.site_name])

  const vote = async (o) => {
    const p = state.poll
    if (p.settings.ask_name && !name.trim()) return toast(t('Please type your name first.'))
    setBusy(true)
    try {
      const r = await api.post(`/polls/${code}/vote`, { option_id: o.id, device: deviceId(), name: name.trim() || undefined })
      if (name.trim()) store.set('pp.voterName', name.trim())
      setState((s) => ({ ...s, myVote: r.my_vote, results: r.results || s.results }))
      setChanging(false)
      confetti({ particleCount: 70, spread: 70, origin: { y: 0.55 }, colors: [o.color], disableForReducedMotion: true })
    } catch (e) {
      if (e.status === 409 && e.data) setState((s) => ({ ...s, myVote: e.data.my_vote, results: e.data.results || s.results }))
      toast(e.message)
    } finally {
      setBusy(false)
    }
  }

  if (state.status === 'missing') return <NotFound message={t('This poll does not exist or was deleted.')} />
  if (state.status === 'loading') return <div className="page-loading">{t('Loading…')}</div>
  if (state.status === 'error') return <div className="page-loading">{state.error}</div>

  const { poll, results, myVote } = state
  const voted = myVote != null && !changing
  const wheel = pollWheel(poll.options, site, { results: voted ? results : null, centerText: voted ? '✓' : 'VOTE' })
  const chosen = poll.options.find((o) => o.id === myVote)

  return (
    <div className="app">
      <Toolbar minimal />
      <main className="app-bg">
        <section className="pl-wrap pl-vote">
          <div className="card pl-card pl-vote-card">
            <div className="pl-label">🗳️ {t('Poll')}{!poll.is_open && <span className="pl-closed">{t('Closed')}</span>}</div>
            <h1 className="pl-question">{poll.question}</h1>

            {!poll.is_open ? (
              <p className="alert">{t('This poll is closed – voting has ended.')}</p>
            ) : voted ? (
              <div className="pl-thanks">
                <span className="pl-check"><Icon name="check" size={20} /></span>
                <div>
                  <b>{t('Thanks – your vote is in!')}</b>
                  <span>{t('You voted')}: <strong style={{ color: chosen?.color }}>{chosen?.text}</strong></span>
                </div>
                {poll.settings.allow_change && <button className="btn btn-soft small" onClick={() => setChanging(true)}>{t('Change vote')}</button>}
              </div>
            ) : (
              <>
                {poll.settings.ask_name && (
                  <label className="pl-name">{t('Your name')}
                    <input className="input" value={name} maxLength={80} placeholder={t('Type your name')} onChange={(e) => setName(e.target.value)} />
                  </label>
                )}
                <p className="muted small">{t('Tap your answer:')}</p>
                <div className="pl-vote-btns">
                  {poll.options.map((o) => (
                    <button key={o.id} className={`pl-vote-btn ${myVote === o.id ? 'was' : ''}`} style={{ '--c': o.color, color: contrastText(o.color) }} disabled={busy} onClick={() => vote(o)}>{o.text}</button>
                  ))}
                </div>
              </>
            )}

            {(voted || !poll.is_open) && results && (
              <>
                <h3 className="pl-sub">{t('Results so far')}</h3>
                <ResultBars results={results} myVote={myVote} />
              </>
            )}
            {(voted || !poll.is_open) && !results && <p className="muted small">{t('The poll creator will share the results.')}</p>}
          </div>

          <aside className="card pl-card pl-preview">
            <div className="pl-wheel"><Wheel wheel={wheel} idle /></div>
            <Link to="/polling-wheel" className="btn btn-soft pl-own">🗳️ {t('Create your own poll – free')}</Link>
          </aside>
        </section>
      </main>
      <Footer />
    </div>
  )
}

/* ------------------------------------------------------------------ results (creator) */
export function PollResults() {
  const { code } = useParams()
  const { t, site, toast, prefs } = useApp()
  const nav = useNavigate()
  const key = useMemo(() => new URLSearchParams(window.location.hash.slice(1)).get('key') || myPolls().find((p) => p.code === code)?.key || '', [code])
  const [state, setState] = useState({ status: 'loading' })
  const [winner, setWinner] = useState(null)
  const [live, setLive] = useState(true)
  const wheelRef = useRef(null)
  const spinning = useRef(false)

  const load = useCallback((quiet) => {
    if (!key) return setState({ status: 'nokey' })
    api.get(`/polls/${code}/results?key=${encodeURIComponent(key)}`)
      .then((r) => {
        if (spinning.current) return
        setState({ status: 'ok', poll: r.data, results: r.results, voters: r.voters })
        rememberPoll({ code, key, question: r.data.question, created: r.data.created_at })
      })
      .catch((e) => !quiet && setState({ status: e.status === 403 ? 'nokey' : e.status === 404 ? 'missing' : 'error', error: e.message }))
  }, [code, key])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    if (!live) return
    const id = setInterval(() => document.visibilityState === 'visible' && load(true), 4000)
    return () => clearInterval(id)
  }, [live, load])
  useEffect(() => { if (state.poll) document.title = `${t('Results')}: ${state.poll.question} | ${site.site_name}` }, [state.poll, site.site_name, t])

  const patch = async (body, msg) => {
    try {
      const r = await api.patch(`/polls/${code}?key=${encodeURIComponent(key)}`, body)
      setState((s) => ({ ...s, poll: { ...s.poll, ...r.data }, results: r.results, voters: body.reset ? [] : s.voters }))
      toast(msg)
    } catch (e) { toast(e.message) }
  }
  const remove = async () => {
    if (!window.confirm(t('Delete this poll and all its votes? This cannot be undone.'))) return
    try {
      await api.del(`/polls/${code}?key=${encodeURIComponent(key)}`)
      forgetPoll(code)
      toast(t('Poll deleted'))
      nav('/polling-wheel')
    } catch (e) { toast(e.message) }
  }
  const spin = async () => {
    if (!wheelRef.current || spinning.current) return
    spinning.current = true
    setWinner(null)
    const r = await wheelRef.current.spin()
    spinning.current = false
    if (r) {
      setWinner(r)
      if (!prefs.reduceMotion) confetti({ particleCount: 110, spread: 90, origin: { y: 0.5 }, colors: [r.color] })
    }
  }

  if (state.status === 'missing') return <NotFound message={t('This poll does not exist or was deleted.')} />
  if (state.status === 'nokey') {
    return (
      <div className="app"><Toolbar minimal /><main className="app-bg"><section className="pl-wrap"><div className="card pl-card center pad-lg">
        <Icon name="lock" size={36} />
        <h2>{t('Results are private')}</h2>
        <p className="muted">{t('Open the private results link you got when you created the poll.')}</p>
        <Link className="btn btn-primary" to={`/poll/${code}`}>{t('Go to the voting page')}</Link>
      </div></section></main><Footer /></div>
    )
  }
  if (state.status === 'loading') return <div className="page-loading">{t('Loading…')}</div>
  if (state.status === 'error') return <div className="page-loading">{state.error}</div>

  const { poll, results, voters } = state
  const wheel = pollWheel(poll.options, site, { results, centerText: 'SPIN' })
  const leader = results.total ? [...results.options].sort((a, b) => b.votes - a.votes)[0] : null
  const tie = leader && results.options.filter((o) => o.votes === leader.votes).length > 1

  return (
    <div className="app">
      <Toolbar minimal />
      <main className="app-bg">
        <section className="pl-wrap pl-results">
          <div className="pl-res-main">
            <div className="card pl-card">
              <div className="pl-res-head">
                <div>
                  <div className="pl-label">{t('Live results')} {live && <span className="pl-live">● {t('LIVE')}</span>}{!poll.is_open && <span className="pl-closed">{t('Closed')}</span>}</div>
                  <h1 className="pl-question">{poll.question}</h1>
                </div>
              </div>
              <div className="pl-kpis">
                <div><b>{results.total}</b><span>{t('votes')}</span></div>
                <div><b>{poll.views}</b><span>{t('page views')}</span></div>
                <div><b>{leader ? (tie ? t('Tie') : leader.text) : '—'}</b><span>{t('leading')}</span></div>
              </div>
              <ResultBars results={results} />
              <div className="row wrap pl-admin-btns">
                <button className={`btn ${poll.is_open ? 'btn-soft' : 'btn-primary'} small`} onClick={() => patch({ is_closed: poll.is_open }, poll.is_open ? t('Poll closed') : t('Poll reopened'))}>
                  <Icon name={poll.is_open ? 'lock' : 'play'} size={15} /> {poll.is_open ? t('Close voting') : t('Reopen voting')}
                </button>
                <button className="btn btn-soft small" onClick={() => setLive((v) => !v)}><Icon name="refresh" size={15} /> {live ? t('Pause live updates') : t('Resume live updates')}</button>
                <label className="check small"><input type="checkbox" checked={poll.settings.show_results} onChange={(e) => patch({ settings: { show_results: e.target.checked } }, t('Saved'))} /> {t('Voters can see results')}</label>
                <span className="grow" />
                <button className="btn btn-text small" onClick={() => window.confirm(t('Remove all votes and start again?')) && patch({ reset: true }, t('Votes cleared'))}>{t('Reset votes')}</button>
                <button className="btn btn-text small danger" onClick={remove}><Icon name="trash" size={15} /> {t('Delete poll')}</button>
              </div>
            </div>

            <div className="card pl-card">
              <h3 className="pl-sub">{t('Share the poll')}</h3>
              <ShareBox code={code} />
            </div>

            {voters.length > 0 && (
              <div className="card pl-card">
                <h3 className="pl-sub">{t('Latest votes')}</h3>
                <div className="table-wrap pl-voters">
                  <table className="table">
                    <thead><tr><th>{t('Voter')}</th><th>{t('Answer')}</th><th>{t('Time')}</th></tr></thead>
                    <tbody>
                      {voters.map((v, i) => {
                        const o = poll.options.find((x) => x.id === v.option_id)
                        return (
                          <tr key={i}>
                            <td>{v.name || <span className="muted">{t('Anonymous')}</span>}</td>
                            <td><span className="pl-dot" style={{ background: o?.color }} /> {v.option}</td>
                            <td className="muted small">{new Date(v.at).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <aside className="card pl-card pl-preview">
            <div className="pl-label">{t('Results wheel')}</div>
            <p className="muted small">{t('Each answer’s slice grows with its votes. Spin to pick a winner weighted by votes – handy for breaking a tie.')}</p>
            <div className="pl-wheel"><Wheel ref={wheelRef} wheel={wheel} onClick={spin} idle={false} /></div>
            <button className="btn tp-go" onClick={spin} disabled={!results.total}><Icon name="play" /> {t('SPIN THE RESULTS WHEEL')}</button>
            {winner && <div className="pl-winner" style={{ background: winner.color, color: contrastText(winner.color) }}>🎉 {winner.entry.text}</div>}
          </aside>
        </section>
      </main>
      <Footer />
    </div>
  )
}
