import { useEffect, useMemo, useRef, useState } from 'react'
import ToolIcon from '../../components/ToolIcon'

/* Shared, dependency-free SVG charts for the admin analytics views. */

export const SERIES = {
  views: { label: 'Page views', cls: 'an-c1' },
  visitors: { label: 'Unique visitors', cls: 'an-c2' },
  spins: { label: 'Spins / picks', cls: 'an-c1' },
}

const fmtN = (n) => (n >= 10000 ? `${Math.round(n / 1000)}k` : n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n))
export const fmtDay = (d, long) =>
  new Date(d + 'T00:00:00').toLocaleDateString(undefined, long ? { weekday: 'short', day: 'numeric', month: 'short' } : { day: 'numeric', month: 'short' })

function niceMax(v) {
  if (v <= 4) return 4
  const p = Math.pow(10, Math.floor(Math.log10(v)))
  const m = [1, 2, 2.5, 5, 10].find((k) => k * p >= v)
  return m * p
}

function useWidth() {
  const ref = useRef(null)
  const [w, setW] = useState(600)
  useEffect(() => {
    if (!ref.current) return
    const ro = new ResizeObserver(([e]) => setW(Math.max(260, e.contentRect.width)))
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [])
  return [ref, w]
}

/** Multi-series line/area chart with a single shared y-axis, legend and crosshair tooltip. */
export function TrendChart({ data = [], keys = ['views', 'visitors'], height = 260 }) {
  const [wrapRef, width] = useWidth()
  const [hover, setHover] = useState(null)
  const pad = { l: 44, r: 14, t: 14, b: 30 }
  const iw = width - pad.l - pad.r
  const ih = height - pad.t - pad.b
  const max = niceMax(Math.max(0, ...data.flatMap((d) => keys.map((k) => d[k] || 0))))
  const n = data.length
  const x = (i) => pad.l + (n <= 1 ? iw / 2 : (i / (n - 1)) * iw)
  const y = (v) => pad.t + ih - (v / max) * ih
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(max * f))
  const every = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(iw / 70))))

  const paths = useMemo(() => keys.map((k) => {
    const pts = data.map((d, i) => [x(i), y(d[k] || 0)])
    const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('')
    const area = pts.length ? `${line}L${pts[pts.length - 1][0].toFixed(1)},${pad.t + ih}L${pts[0][0].toFixed(1)},${pad.t + ih}Z` : ''
    return { k, line, area }
  }), [data, keys, width, max]) // eslint-disable-line

  const onMove = (e) => {
    if (!n) return
    const r = e.currentTarget.getBoundingClientRect()
    const px = e.clientX - r.left
    const i = n <= 1 ? 0 : Math.round(((px - pad.l) / iw) * (n - 1))
    setHover(Math.min(n - 1, Math.max(0, i)))
  }

  const h = hover != null ? data[hover] : null
  const tipLeft = h ? Math.min(Math.max(x(hover), 90), width - 90) : 0

  return (
    <div className="an-trend">
      <div className="an-legend">
        {keys.map((k) => <span key={k} className={SERIES[k].cls}><i />{SERIES[k].label}</span>)}
      </div>
      <div className="an-plot" ref={wrapRef}>
        <svg width={width} height={height} onMouseMove={onMove} onMouseLeave={() => setHover(null)} role="img"
          aria-label={`${keys.map((k) => SERIES[k].label).join(' and ')} per day`}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={pad.l} x2={width - pad.r} y1={y(t)} y2={y(t)} className="an-gl" />
              <text x={pad.l - 8} y={y(t) + 4} className="an-axis" textAnchor="end">{fmtN(t)}</text>
            </g>
          ))}
          {data.map((d, i) => (n - 1 - i) % every === 0 && (
            <text key={d.date} x={x(i)} y={height - 8} className="an-axis" textAnchor={i === n - 1 ? 'end' : i * iw / Math.max(1, n - 1) < 24 ? 'start' : 'middle'}>{fmtDay(d.date)}</text>
          ))}
          {paths.map((p, idx) => idx === 0 && <path key={p.k + 'a'} d={p.area} className={`an-area ${SERIES[p.k].cls}`} />)}
          {paths.map((p) => <path key={p.k} d={p.line} className={`an-line ${SERIES[p.k].cls}`} />)}
          {h && (
            <g>
              <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={pad.t + ih} className="an-cross" />
              {keys.map((k) => <circle key={k} cx={x(hover)} cy={y(h[k] || 0)} r={5} className={`an-dot ${SERIES[k].cls}`} />)}
            </g>
          )}
        </svg>
        {h && (
          <div className="an-tip" style={{ left: tipLeft }}>
            <b>{fmtDay(h.date, true)}</b>
            {keys.map((k) => (
              <div key={k} className={SERIES[k].cls}><i />{SERIES[k].label}<strong>{(h[k] || 0).toLocaleString()}</strong></div>
            ))}
            {h.spins != null && !keys.includes('spins') && <div className="an-tip-muted">Spins / picks<strong>{h.spins.toLocaleString()}</strong></div>}
          </div>
        )}
      </div>
    </div>
  )
}

/** Horizontal bars, one per game. Labels and values in text ink; bar carries magnitude only. */
export function GameBars({ games = [], metric = 'visitors', limit, onPick }) {
  const list = limit ? games.slice(0, limit) : games
  const max = Math.max(1, ...list.map((g) => g[metric] || 0))
  if (!list.length) return <p className="muted">No data yet.</p>
  return (
    <ul className="an-bars">
      {list.map((g) => (
        <li key={g.path} title={`${g.label}: ${(g.views || 0).toLocaleString()} views · ${(g.visitors || 0).toLocaleString()} visitors · ${(g.spins || 0).toLocaleString()} spins`}
          onClick={onPick ? () => onPick(g) : undefined}>
          <span className="an-bar-label"><em><ToolIcon icon={g.emoji} /></em>{g.label}</span>
          <span className="an-bar-track"><i style={{ width: `${(g[metric] || 0) ? Math.max(1.5, ((g[metric] || 0) / max) * 100) : 0}%` }} /></span>
          <span className="an-bar-val">{(g[metric] || 0).toLocaleString()}</span>
        </li>
      ))}
    </ul>
  )
}

export function Delta({ now = 0, prev = 0 }) {
  if (!prev && !now) return <span className="an-delta flat">—</span>
  if (!prev) return <span className="an-delta up">new</span>
  const p = Math.round(((now - prev) / prev) * 100)
  return <span className={`an-delta ${p > 0 ? 'up' : p < 0 ? 'down' : 'flat'}`}>{p > 0 ? '▲' : p < 0 ? '▼' : '•'} {Math.abs(p)}%</span>
}
