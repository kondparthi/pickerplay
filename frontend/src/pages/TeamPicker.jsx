import { useEffect, useMemo, useRef, useState } from 'react'
import confetti from 'canvas-confetti'
import { useApp } from '../store/AppStore'
import Toolbar from '../components/Toolbar'
import Footer from '../components/Footer'
import Icon from '../components/Icon'
import { randomInt, shuffle } from '../lib/random'
import { contrastText, THEMES } from '../lib/colors'
import { playAfter, tick, unlockAudio } from '../lib/audio'
import { store, downloadJson } from '../lib/storage'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import AdSlot from '../components/AdSlot'
import '../team.css'
import ToolIcon from '../components/ToolIcon'

function Card({ title, children }) {
  const { site } = useApp()
  return (
    <article className="info-card card">
      <h2>
        {site.favicon_url && <img src={site.favicon_url} alt="" className="info-icon" width="30" height="30" loading="lazy" decoding="async" />}
        {title}
      </h2>
      {children}
    </article>
  )
}

/** SEO content for /team-picker, in the same card style as the home page. */
function TeamContent({ onTryExample }) {
  const { t, site, boot } = useApp()
  const name = site.site_name
  const tools = boot.tools || []
  return (
    <>
      <section className="tp-intro">
        <h2>{t('Team Picker – Random Team Generator')} | {name}</h2>
        <p className="tp-lead">{t('Tired of “that’s not fair!” and 10 minutes wasted picking teams?')}</p>
        <p>{t('Paste your list of names and split it into fair, random teams in one click. No sign-up, no install, 100% free. Also known as a random group generator, team randomizer or team picker wheel, it is the fastest way to make unbiased teams for games, classrooms, work projects and events.')}</p>
      </section>
      <section className="info-grid tp-info">
        <Card title={t('How to split a list of names into teams')}>
          <ol>
            <li>{t('Paste or type your names in the box, one per line.')}</li>
            <li>{t('Choose the number of teams, or switch to “Members per team”.')}</li>
            <li>{t('Tick “Pick a team leader” if each group needs a captain.')}</li>
            <li>{t('Press Start generating and watch the names drop into the teams.')}</li>
            <li>{t('Copy the result or download it as CSV.')}</li>
          </ol>
          <p className="muted">{t('Every name is shuffled with a secure random generator, so nobody can game the draw.')}</p>
        </Card>

        <Card title={t('Pick a team leader')}>
          <p>{t('Turn on “Pick a team leader” and the tool randomly chooses a leader, captain or spokesperson for every group as soon as the teams are made. The leader is marked with a 👑 and listed first.')}</p>
        </Card>

        <Card title={t('Team Picker is best for')}>
          <ul className="tp-checks">
            <li><b>{t('Teachers')}:</b> {t('classroom groups, presenters and line leaders')}</li>
            <li><b>{t('Coaches')}:</b> {t('fair sides for practice and a random captain')}</li>
            <li><b>{t('Offices')}:</b> {t('team-building, hackathons and project squads')}</li>
            <li><b>{t('Workshops')}:</b> {t('breakout rooms and a spokesperson per table')}</li>
            <li><b>{t('Games & parties')}:</b> {t('quiz teams, pairs and who goes first')}</li>
            <li><b>{t('Tournaments')}:</b> {t('random draws for brackets and pools')}</li>
          </ul>
        </Card>

        <Card title={t('Balance teams fairly')}>
          <p>{t('Want an even mix of boys and girls, or beginners and experts? Add a label after a comma and tick “Balance teams by label”.')}</p>
          <pre className="tp-example">{BALANCE_EXAMPLE}</pre>
          {onTryExample && <button className="btn btn-soft small" onClick={onTryExample}><Icon name="play" size={15} /> {t('Try this example')}</button>}
          <p className="muted">{t('Each label is spread evenly across all teams, and team sizes never differ by more than one person.')}</p>
        </Card>

        <Card title={t('Export and share results instantly')}>
          <ul>
            <li>{t('Copy the teams and paste them into WhatsApp, email, docs or slides.')}</li>
            <li>{t('Download as CSV for Excel / Google Sheets, or JSON for apps.')}</li>
            <li>{t('Use Full width to show the teams on a projector or TV.')}</li>
          </ul>
        </Card>

        <Card title={t('Is the team picker fair?')}>
          <p>{t('Yes. Names are shuffled with your browser’s cryptographically secure random generator (crypto.getRandomValues), not Math.random(). Which teams receive the extra person when names don’t divide evenly is random too.')}</p>
          <p className="muted">{t('Your list stays in your browser – nothing is uploaded.')}</p>
        </Card>

        <Card title={t('Frequently asked questions')}>
          <details><summary>{t('How many names can I add?')}</summary><p>{t('Thousands. The tool works instantly even for a whole school year group.')}</p></details>
          <details><summary>{t('Can I make random pairs?')}</summary><p>{t('Yes – switch to “Members per team” and set it to 2.')}</p></details>
          <details><summary>{t('Can I use only some of the names?')}</summary><p>{t('Yes – set “Use only” to pick a random subset, e.g. 10 players out of 25.')}</p></details>
          <details><summary>{t('Can I rename the teams?')}</summary><p>{t('Tick “Custom team names” and type one name per line, e.g. Red, Blue, Green.')}</p></details>
        </Card>

        <Card title={t('Prefer a spinning wheel?')}>
          <p>{t('Use the classic wheel to pick one winner at a time, or try one of our other pickers.')}</p>
          <div className="tool-chips">
            <Link to="/" className="tool-chip"><span>🎡</span> {t('Wheel spinner')}</Link>
            {tools.slice(0, 10).map((tool) => (
              <Link key={tool.slug} to={`/${tool.slug}`} className="tool-chip"><span><ToolIcon icon={tool.emoji} /></span> {tool.name}</Link>
            ))}
          </div>
        </Card>
      </section>
    </>
  )
}

const KEY = 'pp.teampicker.v3'
const DEFAULT_NAMES = 'Christopher\nLisa\nDaniel\nNissy\nMatthew\nSandra\nSatvik\nSteven'
const BALANCE_EXAMPLE = 'Amelia, girl\nTom, boy\nNissy, girl\nSatvik, boy'
const TEAM_COLORS = ['#2e7d32', '#f5b70a', '#1e88e5', '#e53935', '#8e24aa', '#00897b', '#fb8c00', '#5546c9', '#6d4c41', '#d81b60']

/** − [ n ] + control; typing is free-form and only committed when valid, so “3” never becomes “13”. */
function Stepper({ value, min = 1, max = 99, onChange, label }) {
  const [draft, setDraft] = useState(String(value))
  useEffect(() => setDraft(String(value)), [value])
  const commit = (v) => {
    const n = Math.max(min, Math.min(max, parseInt(v, 10) || min))
    onChange(n)
    setDraft(String(n))
  }
  return (
    <span className="tp-stepper">
      <button type="button" onClick={() => commit(value - 1)} disabled={value <= min} aria-label={`${label} −1`}>−</button>
      <input className="input" inputMode="numeric" value={draft} aria-label={label}
        onChange={(e) => {
          const v = e.target.value.replace(/[^0-9]/g, '')
          setDraft(v)
          const n = parseInt(v, 10)
          if (n >= min && n <= max) onChange(n)
        }}
        onBlur={() => commit(draft)}
        onKeyDown={(e) => { if (e.key === 'Enter') commit(draft) }} />
      <button type="button" onClick={() => commit(value + 1)} disabled={value >= max} aria-label={`${label} +1`}>+</button>
    </span>
  )
}

/** "Name, Label" -> { name, label } (label is used for balancing, e.g. gender / skill / class) */
function parse(text) {
  return text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).map((line) => {
    const i = line.lastIndexOf(',')
    if (i > 0) return { name: line.slice(0, i).trim(), label: line.slice(i + 1).trim().toLowerCase() }
    return { name: line, label: '' }
  })
}

/**
 * Builds teams with crypto randomness.
 * - sizes never differ by more than 1, and the "bigger" teams are random (not always Team 1)
 * - balance=true deals each label group round-robin so every team gets a fair mix
 */
function makeTeams(people, count, { balance, leader }) {
  const order = shuffle([...Array(count).keys()]) // random dealing order
  const teams = Array.from({ length: count }, () => [])
  let pointer = 0
  const deal = (list) => list.forEach((p) => { teams[order[pointer % count]].push(p); pointer++ })
  if (balance) {
    const groups = new Map()
    people.forEach((p) => {
      const k = p.label || '~'
      if (!groups.has(k)) groups.set(k, [])
      groups.get(k).push(p)
    })
    ;[...groups.values()].sort((a, b) => b.length - a.length).forEach((g) => deal(shuffle(g)))
  } else {
    deal(shuffle(people))
  }
  return teams.map((members) => {
    const m = shuffle(members)
    if (leader && m.length) {
      const li = randomInt(m.length)
      const [l] = m.splice(li, 1)
      m.unshift({ ...l, leader: true })
    }
    return m
  })
}

export default function TeamPicker() {
  const { t, site, prefs, toast } = useApp()
  const saved = useMemo(() => store.get(KEY, {}), [])
  const [text, setText] = useState(saved.text ?? DEFAULT_NAMES)
  const [mode, setMode] = useState(saved.mode || 'teams') // teams | size
  const [teamCount, setTeamCount] = useState(saved.teamCount || 2)
  const [teamSize, setTeamSize] = useState(saved.teamSize || 2)
  const [pickQty, setPickQty] = useState(0)
  const [leader, setLeader] = useState(!!saved.leader)
  const [balance, setBalance] = useState(!!saved.balance)
  const [animate, setAnimate] = useState(saved.animate ?? true)
  const [sound, setSound] = useState(saved.sound ?? true)
  const [fullWidth, setFullWidth] = useState(false)
  const [teamNamesText, setTeamNamesText] = useState(saved.teamNamesText || '')
  const [showNames, setShowNames] = useState(false)
  const [teams, setTeams] = useState(saved.teams || null) // [[{name,label,leader}]]
  const [revealed, setRevealed] = useState(Infinity)
  const [running, setRunning] = useState(false)
  const timer = useRef(null)
  const boardRef = useRef(null)

  const people = useMemo(() => parse(text), [text])
  const total = people.length
  const usable = pickQty > 0 && pickQty < total ? pickQty : total
  const count = Math.max(1, Math.min(usable || 1, mode === 'teams' ? Number(teamCount) || 1 : Math.ceil(usable / Math.max(1, Number(teamSize) || 1))))
  const teamNames = teamNamesText.split(/\r?\n/).map((s) => s.trim())
  const nameOf = (i) => teamNames[i] || `${t('Team')} ${i + 1}`
  const labels = useMemo(() => new Set(people.map((p) => p.label).filter(Boolean)).size, [people])

  useEffect(() => {
    document.title = `${t('Team Picker')} – ${t('Random Team Generator')} | ${site.site_name}`
  }, [site.site_name, t])

  useEffect(() => {
    store.set(KEY, { text, mode, teamCount, teamSize, leader, balance, animate, sound, teamNamesText, teams })
  }, [text, mode, teamCount, teamSize, leader, balance, animate, sound, teamNamesText, teams])

  useEffect(() => () => clearInterval(timer.current), [])

  // changing the number of teams / team size shows a fresh preview with the new count
  const firstCount = useRef(true)
  useEffect(() => {
    if (firstCount.current) { firstCount.current = false; return }
    if (!running) setTeams(null)
  }, [count, mode]) // eslint-disable-line

  const start = () => {
    if (total < 2) return toast(t('Add at least 2 names.'))
    unlockAudio()
    clearInterval(timer.current)
    const pool = usable < total ? shuffle(people).slice(0, usable) : people
    const result = makeTeams(pool, count, { balance, leader })
    setTeams(result)
    api.post('/stats/spin', { seconds: animate ? 3 : 1, path: '/team-picker' }).catch(() => {})
    const top = boardRef.current?.getBoundingClientRect().top ?? 0
    if (top < 0 || top > window.innerHeight * 0.6) {
      window.scrollTo({ top: Math.max(0, window.scrollY + top - 76), behavior: 'auto' })
    }
    const finish = () => {
      setRunning(false)
      if (sound) playAfter('subdued', 50)
      if (!prefs.reduceMotion) confetti({ particleCount: 110, spread: 90, origin: { y: 0.45 }, colors: TEAM_COLORS.slice(0, count), disableForReducedMotion: true })
    }
    const n = result.reduce((a, b) => a + b.length, 0)
    if (!animate || prefs.reduceMotion) {
      setRevealed(Infinity)
      finish()
      return
    }
    setRunning(true)
    setRevealed(0)
    const step = Math.max(25, Math.min(220, 2400 / n))
    let i = 0
    timer.current = setInterval(() => {
      i++
      setRevealed(i)
      if (sound) tick('soft', 45)
      if (i >= n) {
        clearInterval(timer.current)
        setRevealed(Infinity)
        finish()
      }
    }, step)
  }

  // reveal order: round-robin across teams so the board fills like a live draft
  const revealIndex = useMemo(() => {
    const map = new Map()
    if (!teams) return map
    let k = 0
    const max = Math.max(...teams.map((x) => x.length), 0)
    for (let r = 0; r < max; r++) teams.forEach((team, ti) => { if (team[r]) map.set(`${ti}-${r}`, k++) })
    return map
  }, [teams])

  const asText = () => (teams || []).map((team, i) => `${nameOf(i)}\n${team.map((p) => `- ${p.name}${p.leader ? ' (leader)' : ''}`).join('\n')}`).join('\n\n')
  const copy = () => navigator.clipboard?.writeText(asText()).then(() => toast(t('Copied to clipboard')))
  const downloadCsv = () => {
    const rows = [['Team', 'Name', 'Leader', 'Label']]
    ;(teams || []).forEach((team, i) => team.forEach((p) => rows.push([nameOf(i), p.name, p.leader ? 'yes' : '', p.label])))
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = 'teams.csv'
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 500)
  }

  return (
    <div className="app">
      <Toolbar minimal />
      <main className="app-bg">
        <section className={`tp-wrap ${fullWidth ? 'tp-full' : ''}`}>
          <div className="tp-board" ref={boardRef} style={{ scrollMarginTop: 80 }}>
            <div className="tp-board-head">
              <div>
                <h1>{t('Team Picker')}</h1>
                <p className="muted">{t('Randomly split people into fair teams or groups')}</p>
              </div>
              <div className="row wrap">
                <button className="btn btn-primary tp-start" onClick={start} disabled={running}>
                  <Icon name="shuffle" /> {teams ? t('Regenerate') : t('Start generating')}
                </button>
                {teams && !running && (
                  <>
                    <button className="chip-btn" onClick={copy}><Icon name="copy" size={16} /> {t('Copy')}</button>
                    <button className="chip-btn" onClick={downloadCsv}><Icon name="download" size={16} /> CSV</button>
                    <button className="chip-btn" onClick={() => downloadJson('teams.json', { teams: teams.map((m, i) => ({ name: nameOf(i), members: m })) })}><Icon name="download" size={16} /> JSON</button>
                    <button className="chip-btn" onClick={() => setTeams(null)}><Icon name="trash" size={16} /> {t('Clear groups')}</button>
                  </>
                )}
                <button className="chip-btn" onClick={() => setFullWidth((f) => !f)} title={t('Full width')}>
                  <Icon name={fullWidth ? 'minimize' : 'maximize'} size={16} /> {fullWidth ? t('Show settings') : t('Full width')}
                </button>
              </div>
            </div>

            {!teams ? (
              <>
                <div className="tp-grid tp-preview">
                  {Array.from({ length: Math.min(count, 12) }, (_, ti) => {
                    const color = TEAM_COLORS[ti % TEAM_COLORS.length]
                    const slots = Math.min(Math.ceil((usable || 0) / count) || 1, 6)
                    return (
                      <article key={ti} className="tp-team card" style={{ '--team': color }}>
                        <header style={{ background: color, color: contrastText(color) }}>
                          <span>{nameOf(ti)}</span>
                          <span className="tp-count">0/{Math.floor(usable / count) + (ti < usable % count ? 1 : 0)}</span>
                        </header>
                        <ol>
                          {Array.from({ length: slots }, (_, r) => (
                            <li key={r} className="tp-slot"><span className="tp-num">{r + 1}</span><span className="tp-ghost" /></li>
                          ))}
                        </ol>
                      </article>
                    )
                  })}
                </div>
                {count > 12 && <p className="muted small">+{count - 12} {t('more teams')}</p>}
                <p className="muted small tp-hint"><Icon name="users" size={15} /> {total} {t('names')} → {count} {t('teams')} · {t('press Start generating to fill the teams')}</p>
              </>
            ) : (
              <div className={`tp-grid ${running ? 'is-running' : ''}`}>
                {teams.map((team, ti) => {
                  const color = TEAM_COLORS[ti % TEAM_COLORS.length]
                  const shown = team.filter((_, r) => (revealIndex.get(`${ti}-${r}`) ?? 0) < revealed)
                  return (
                    <article key={ti} className="tp-team card" style={{ '--team': color }}>
                      <header style={{ background: color, color: contrastText(color) }}>
                        <span>{nameOf(ti)}</span>
                        <span className="tp-count">{shown.length}/{team.length}</span>
                      </header>
                      <ol>
                        {shown.map((p, r) => (
                          <li key={p.name + r} className={p.leader ? 'leader' : ''}>
                            <span className="tp-num">{r + 1}</span>
                            <span className="tp-name">{p.name}</span>
                            {p.leader && <span className="tp-badge">👑 {t('Leader')}</span>}
                            {balance && p.label && <span className="tp-label">{p.label}</span>}
                          </li>
                        ))}
                      </ol>
                    </article>
                  )
                })}
              </div>
            )}
          </div>

          {!fullWidth && (
            <aside className="panel card tp-panel">
              <div className="tabs"><span className="tab active">{t('Entries')} <span className="badge">{total}</span></span></div>
              <div className="panel-tools">
                <button className="chip-btn" onClick={() => setText(shuffle(text.split(/\r?\n/).filter((l) => l.trim())).join('\n'))}><Icon name="shuffle" size={16} /> {t('Shuffle')}</button>
                <button className="chip-btn" onClick={() => setText(text.split(/\r?\n/).filter((l) => l.trim()).sort((a, b) => a.localeCompare(b)).join('\n'))}><Icon name="sort" size={16} /> {t('Sort')}</button>
                <button className="chip-btn" onClick={() => setText('')}><Icon name="trash" size={16} /> {t('Clear')}</button>
              </div>
              <textarea className="entries-textarea tp-names" value={text} spellCheck={false} placeholder={'Christopher\nLisa\nDaniel…'} onChange={(e) => setText(e.target.value)} />
              {balance && <p className="muted small">{t('Add a label after a comma to balance teams, e.g. “Amelia, girl” or “Tom, boy”.')} {labels ? `(${labels} ${t('labels found')})` : ''}</p>}

              <div className="tp-settings">
                <div className="tp-mode">
                  <button className={mode === 'teams' ? 'active' : ''} onClick={() => setMode('teams')}>{t('Number of teams')}</button>
                  <button className={mode === 'size' ? 'active' : ''} onClick={() => setMode('size')}>{t('Members per team')}</button>
                </div>
                {mode === 'teams' ? (
                  <div className="tp-field">{t('Number of teams')}
                    <Stepper value={teamCount} min={1} max={Math.max(2, total)} onChange={setTeamCount} label={t('Number of teams')} />
                  </div>
                ) : (
                  <div className="tp-field">{t('Members per team')}
                    <Stepper value={teamSize} min={1} max={Math.max(2, total)} onChange={setTeamSize} label={t('Members per team')} />
                  </div>
                )}
                <label className="tp-field">{t('Use only')} <span className="muted small">({t('0 = everyone')})</span>
                  <span className="row"><input className="input" type="number" min="0" max={total} value={pickQty} onChange={(e) => setPickQty(Math.max(0, Number(e.target.value) || 0))} /><span className="muted">/ {total}</span></span>
                </label>
                <p className="muted small tp-summary">{usable} {t('names')} → <b>{count}</b> {t('teams')} · {Math.floor(usable / count)}–{Math.ceil(usable / count)} {t('per team')}</p>
              </div>

              <label className="check"><input type="checkbox" checked={leader} onChange={(e) => setLeader(e.target.checked)} /> {t('Pick a team leader')}</label>
              <label className="check"><input type="checkbox" checked={balance} onChange={(e) => setBalance(e.target.checked)} /> {t('Balance teams by label (gender, skill…)')}</label>
              <label className="check"><input type="checkbox" checked={animate} onChange={(e) => setAnimate(e.target.checked)} /> {t('Animate the draw')}</label>
              <label className="check"><input type="checkbox" checked={sound} onChange={(e) => setSound(e.target.checked)} /> {t('Sound')}</label>
              <label className="check"><input type="checkbox" checked={showNames} onChange={(e) => setShowNames(e.target.checked)} /> {t('Custom team names')}</label>
              {showNames && (
                <textarea className="input tp-teamnames" rows={Math.min(8, count + 1)} placeholder={Array.from({ length: count }, (_, i) => `${t('Team')} ${i + 1}`).join('\n')} value={teamNamesText} onChange={(e) => setTeamNamesText(e.target.value)} />
              )}

              <button className="btn tp-go" onClick={start} disabled={running}>
                <Icon name="play" /> {running ? t('Generating…') : t('START GENERATING')}
              </button>
            </aside>
          )}
        </section>
      </main>

      <div className="content-ad-wrap"><AdSlot place="team" /></div>
      <TeamContent onTryExample={() => { setText(BALANCE_EXAMPLE); setBalance(true); setMode('teams'); setTeamCount(2); setTeams(null); window.scrollTo({ top: 0, behavior: 'auto' }) }} />
      <Footer />
    </div>
  )
}
