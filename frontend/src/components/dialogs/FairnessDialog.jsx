import { useState } from 'react'
import { useApp } from '../../store/AppStore'
import { buildSegments } from '../../lib/wheelRender'
import { weightedIndex } from '../../lib/random'
import Modal from '../Modal'

/** "Run 7,000 spins" - proves the distribution with the very same random function the wheel uses. */
export default function FairnessDialog() {
  const { activeWheel, closeDialog, t } = useApp()
  const [result, setResult] = useState(null)
  const [running, setRunning] = useState(false)
  const { all } = buildSegments(activeWheel)
  const N = 7000

  const run = () => {
    setRunning(true)
    setTimeout(() => {
      const weights = all.map((s) => s.weight)
      const counts = new Array(all.length).fill(0)
      const t0 = performance.now()
      for (let i = 0; i < N; i++) counts[weightedIndex(weights)]++
      const total = weights.reduce((a, b) => a + b, 0)
      setResult({
        ms: Math.round(performance.now() - t0),
        rows: all.map((s, i) => ({ text: s.entry.text || '🖼', count: counts[i], expected: (s.weight / total) * 100, actual: (counts[i] / N) * 100 })),
      })
      setRunning(false)
    }, 30)
  }

  const max = result ? Math.max(...result.rows.map((r) => r.actual), 1) : 1
  return (
    <Modal title={t('Run 7,000 spins')} onClose={closeDialog} wide>
      <p>{t('This runs 7,000 picks on your current entries with the same crypto.getRandomValues() function the wheel uses, and compares the results with the expected chance.')}</p>
      {!all.length && <div className="alert">{t('Add some entries first.')}</div>}
      <button className="btn btn-primary" onClick={run} disabled={running || !all.length}>
        {running ? t('Spinning…') : result ? t('Run again') : t('Run 7,000 spins')}
      </button>
      {result && (
        <>
          <p className="muted small">{N.toLocaleString()} {t('spins in')} {result.ms} ms</p>
          <div className="fair-table">
            <div className="fair-row fair-head">
              <span>{t('Entry')}</span><span>{t('Wins')}</span><span>{t('Actual')}</span><span>{t('Expected')}</span><span />
            </div>
            {result.rows.slice(0, 200).map((r, i) => (
              <div key={i} className="fair-row">
                <span className="ellipsis">{r.text}</span>
                <span>{r.count}</span>
                <span>{r.actual.toFixed(2)}%</span>
                <span className="muted">{r.expected.toFixed(2)}%</span>
                <span className="fair-bar"><i style={{ width: `${(r.actual / max) * 100}%` }} /></span>
              </div>
            ))}
          </div>
        </>
      )}
    </Modal>
  )
}
