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
import '../team.css'

const KEY = 'pp.teampicker.v1'
const DEFAULT_NAMES = 'Anthony\nBernard\nCherry\nDiana\nEthan\nFarah\nGeorge\nHina'
const TEAM_COLORS = ['#2e7d32', '#f5b70a', '#1e88e5', '#e53935', '#8e24aa', '#00897b', '#fb8c00', '#5546c9', '#6d4c41', '#d81b60']

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

  const start = () => {
    if (total < 2) return toast(t('Add at least 2 names.'))
    unlockAudio()
    clearInterval(timer.current)
    const pool = usable < total ? shuffle(people).slice(0, usable) : people
    const result = makeTeams(pool, count, { balance, leader })
    setTeams(result)
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
              <div className="tp-empty">
                <Icon name="users" size={56} />
                <h2>{t('Teams board')}</h2>
                <p className="muted">{t('Enter names on the right, choose the number of teams and press Start generating.')}</p>
                <p className="muted small">{total} {t('names')} → {count} {t('teams')} · ~{Math.ceil((usable || 0) / count)} {t('per team')}</p>
              </div>
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
              <textarea className="entries-textarea tp-names" value={text} spellCheck={false} placeholder={'Anthony\nBernard\nCherry…'} onChange={(e) => setText(e.target.value)} />
              {balance && <p className="muted small">{t('Add a label after a comma to balance teams, e.g. “Asha, girl” or “Ravi, senior”.')} {labels ? `(${labels} ${t('labels found')})` : ''}</p>}

              <div className="tp-settings">
                <div className="tp-mode">
                  <button className={mode === 'teams' ? 'active' : ''} onClick={() => setMode('teams')}>{t('Number of teams')}</button>
                  <button className={mode === 'size' ? 'active' : ''} onClick={() => setMode('size')}>{t('Members per team')}</button>
                </div>
                {mode === 'teams' ? (
                  <label className="tp-field">{t('Number of teams')}
                    <input className="input" type="number" min="1" max={Math.max(1, total)} value={teamCount} onChange={(e) => setTeamCount(Math.max(1, Number(e.target.value) || 1))} />
                  </label>
                ) : (
                  <label className="tp-field">{t('Members per team')}
                    <input className="input" type="number" min="1" max={Math.max(1, total)} value={teamSize} onChange={(e) => setTeamSize(Math.max(1, Number(e.target.value) || 1))} />
                  </label>
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

      <section className="tool-content card prose">
        <h2>{t('How to use the Team Picker')}</h2>
        <ol>
          <li>{t('Type or paste the names, one per line.')}</li>
          <li>{t('Choose how many teams you want, or how many people per team.')}</li>
          <li>{t('Optionally pick a leader for each team or balance teams by a label such as gender or skill level.')}</li>
          <li>{t('Press Start generating. Copy the result or download it as CSV.')}</li>
        </ol>
        <h2>{t('Is it fair?')}</h2>
        <p>{t('Names are shuffled with your browser’s cryptographically secure random generator. Team sizes never differ by more than one person, and which teams get the extra person is random too.')}</p>
      </section>
      <Footer />
    </div>
  )
}
