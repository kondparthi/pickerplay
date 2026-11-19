// Lightweight i18n: English text is the key. Add a language by creating ./xx.js
// (copy hi.js) and adding it to LANGUAGES + DICTS below. Missing strings fall back to English.
import hi from './hi'
import te from './te'
import ta from './ta'
import es from './es'
import fr from './fr'
import de from './de'
import pl from './pl'

export const LANGUAGES = [
  { code: 'en', name: 'English', english: 'English' },
  { code: 'hi', name: 'हिंदी', english: 'Hindi' },
  { code: 'te', name: 'తెలుగు', english: 'Telugu' },
  { code: 'ta', name: 'தமிழ்', english: 'Tamil' },
  { code: 'es', name: 'Español', english: 'Spanish' },
  { code: 'fr', name: 'Français', english: 'French' },
  { code: 'de', name: 'Deutsch', english: 'German' },
  { code: 'pl', name: 'Polski', english: 'Polish' },
]

const DICTS = { hi, te, ta, es, fr, de, pl }

export function makeT(lang) {
  const dict = DICTS[lang] || {}
  return (key) => dict[key] ?? key
}
