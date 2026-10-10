// Cryptographically secure randomness (crypto.getRandomValues) - never Math.random for results.
const buf = new Uint32Array(2)

/** Uniform float in [0, 1) with 53 bits of entropy. */
export function secureRandom() {
  crypto.getRandomValues(buf)
  // 27 bits + 26 bits = 53-bit mantissa
  return ((buf[0] >>> 5) * 67108864 + (buf[1] >>> 6)) / 9007199254740992
}

/** Integer in [0, n) without modulo bias. */
export function randomInt(n) {
  return Math.floor(secureRandom() * n)
}

/** Pick an index from an array of non-negative weights. */
export function weightedIndex(weights) {
  let total = 0
  for (const w of weights) total += Math.max(0, w)
  if (total <= 0) return -1
  let r = secureRandom() * total
  for (let i = 0; i < weights.length; i++) {
    r -= Math.max(0, weights[i])
    if (r < 0) return i
  }
  return weights.length - 1
}

/** Fisher-Yates shuffle (returns a new array). */
export function shuffle(arr) {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomInt(i + 1)
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function uid(prefix = 'e') {
  const b = new Uint8Array(6)
  crypto.getRandomValues(b)
  return prefix + Array.from(b, (x) => x.toString(36).padStart(2, '0')).join('').slice(0, 9)
}
