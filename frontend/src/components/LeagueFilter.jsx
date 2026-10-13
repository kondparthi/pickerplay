import { useMemo, useState } from 'react'
import { useApp } from '../store/AppStore'
import { leagueFilters } from '../lib/sports'
import { makeEntries } from '../lib/defaults'

/** Conference / division chips for the NBA, NFL and MLB team pickers. */
export default function LeagueFilter({ slug }) {
  const { ws, setEntries, toast, t } = useApp()
  const filters = useMemo(() => leagueFilters(slug), [slug])
  const [active, setActive] = useState('all')
  if (!filters.length) return null

  const choose = (f) => {
    setActive(f.id)
    const teams = [...f.teams].sort((a, b) => a.name.localeCompare(b.name))
    setEntries(ws.active, makeEntries(teams.map((x) => ({ text: x.name, color: x.color }))))
    toast(`${f.label}: ${teams.length} ${t('teams')}`)
  }

  const top = filters.filter((f) => f.level < 2)
  const divisions = filters.filter((f) => f.level === 2)
  return (
    <div className="league-filter" role="group" aria-label={t('Filter teams')}>
      <div className="lf-row">
        {top.map((f) => (
          <button key={f.id} className={`lf-chip ${active === f.id ? 'on' : ''} ${f.level === 0 ? 'lf-all' : ''}`} onClick={() => choose(f)}>{f.label}</button>
        ))}
      </div>
      <div className="lf-row lf-div">
        {divisions.map((f) => (
          <button key={f.id} className={`lf-chip small ${active === f.id ? 'on' : ''}`} onClick={() => choose(f)}>{f.label}</button>
        ))}
      </div>
    </div>
  )
}
