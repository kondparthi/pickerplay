/** A picker tool's icon: an emoji, or an image path/URL (e.g. /brand/tod.svg). */
export const isImageIcon = (v) => typeof v === 'string' && /^(\/|https?:\/\/)/.test(v)

export default function ToolIcon({ icon, fallback = '🎯', className = '' }) {
  const v = icon || fallback
  if (isImageIcon(v)) return <img src={v} alt="" className={`tool-icon-img ${className}`} loading="lazy" />
  return <>{v}</>
}
