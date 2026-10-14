import { store } from './storage'

const TOKEN_KEY = 'pp.token'

export function getToken() {
  return store.get(TOKEN_KEY)
}
export function setToken(t) {
  if (t) store.set(TOKEN_KEY, t)
  else store.remove(TOKEN_KEY)
}

export class ApiError extends Error {
  constructor(message, status, errors, data) {
    super(message)
    this.status = status
    this.errors = errors || {}
    this.data = data || null
  }
}

async function request(method, url, body, { form = false } = {}) {
  const headers = { Accept: 'application/json' }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  let payload
  if (form) payload = body
  else if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }
  let res
  try {
    res = await fetch('/api' + url, { method, headers, body: payload })
  } catch {
    throw new ApiError('Network error - please check your connection.', 0)
  }
  let data = null
  const text = await res.text()
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = null
  }
  if (!res.ok) {
    if (res.status === 401 && token) setToken(null)
    const firstError = data?.errors ? Object.values(data.errors)[0]?.[0] : null
    const msg = firstError || data?.message || (res.status === 429 ? 'Too many requests, please wait a moment.' : `Request failed (${res.status})`)
    throw new ApiError(msg, res.status, data?.errors, data)
  }
  if (data === null && text) throw new ApiError('Unexpected server response', res.status)
  return data
}

export const api = {
  get: (u) => request('GET', u),
  post: (u, b) => request('POST', u, b ?? {}),
  put: (u, b) => request('PUT', u, b ?? {}),
  patch: (u, b) => request('PATCH', u, b ?? {}),
  del: (u) => request('DELETE', u),
  upload: (u, formData) => request('POST', u, formData, { form: true }),
}

/** Upload an image file; falls back to a data URL when the server is unavailable. */
export async function uploadImage(file) {
  const fd = new FormData()
  fd.append('image', file)
  try {
    const r = await api.upload('/uploads', fd)
    return r.url
  } catch (e) {
    if (e.status === 0 || e.status === 404 || e.status >= 500) {
      // offline / no backend: shrink & inline the image
      return await shrinkToDataUrl(file, 256)
    }
    throw e
  }
}

export function shrinkToDataUrl(file, max = 256) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height))
      const c = document.createElement('canvas')
      c.width = Math.round(img.width * scale)
      c.height = Math.round(img.height * scale)
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
      resolve(c.toDataURL('image/webp', 0.85))
      URL.revokeObjectURL(img.src)
    }
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}
