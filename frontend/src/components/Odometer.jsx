import { useEffect, useState } from 'react'

/** Rolling-digit counter for the activity card. */
export default function Odometer({ value }) {
  const [shown, setShown] = useState(0)
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(value))
    return () => cancelAnimationFrame(id)
  }, [value])
  const str = Math.max(0, Math.floor(shown)).toLocaleString('en-US')
  return (
    <span className="odometer" aria-label={str}>
      {str.split('').map((ch, i) =>
        /\d/.test(ch) ? (
          <span key={str.length - i} className="odo-digit">
            <span className="odo-strip" style={{ transform: `translateY(-${Number(ch) * 10}%)` }}>
              {'0123456789'.split('').map((d) => (
                <span key={d}>{d}</span>
              ))}
            </span>
          </span>
        ) : (
          <span key={`s${str.length - i}`} className="odo-sep">
            {ch}
          </span>
        )
      )}
    </span>
  )
}
