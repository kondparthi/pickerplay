import { lazy, Suspense, useEffect } from 'react'
import { Route, Routes, useLocation, useParams } from 'react-router-dom'
import { api } from './lib/api'
import Home from './pages/Home'
import SlugRoute from './pages/SlugRoute'
const Gallery = lazy(() => import('./pages/Gallery'))
const Embed = lazy(() => import('./pages/Embed'))
const PageView = lazy(() => import('./pages/PageView'))
const Account = lazy(() => import('./pages/Account'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
import NotFound from './pages/NotFound'
const TeamPicker = lazy(() => import('./pages/TeamPicker'))
const PollCreate = lazy(() => import('./pages/Polling').then((m) => ({ default: m.PollCreate })))
const PollVote = lazy(() => import('./pages/Polling').then((m) => ({ default: m.PollVote })))
const PollResults = lazy(() => import('./pages/Polling').then((m) => ({ default: m.PollResults })))
const BlogList = lazy(() => import('./pages/BlogList'))
const BlogPost = lazy(() => import('./pages/BlogPost'))
import Dialogs from './components/Dialogs'
import Toasts from './components/Toasts'
import CookieBanner from './components/CookieBanner'

const Admin = lazy(() => import('./pages/admin/Admin'))

function EmbedRoute() {
  const { code } = useParams()
  return <Embed code={code} />
}

// First-party, cookie-free page-view counter (skips admin/account and Do-Not-Track browsers).
function usePageTracking() {
  const { pathname } = useLocation()
  useEffect(() => {
    if (/^\/(admin|account|reset-password)/.test(pathname)) return
    if (navigator.doNotTrack === '1' || window.doNotTrack === '1') return
    const t = setTimeout(() => api.post('/track', { path: pathname }).catch(() => {}), 400)
    return () => clearTimeout(t)
  }, [pathname])
}

export default function App() {
  usePageTracking()
  return (
    <>
      <Suspense fallback={<div className="page-loading" />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/team-picker" element={<TeamPicker />} />
        <Route path="/polling-wheel" element={<PollCreate />} />
        <Route path="/poll/:code" element={<PollVote />} />
        <Route path="/poll/:code/results" element={<PollResults />} />
        <Route path="/blog" element={<BlogList />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="/embed/:code" element={<EmbedRoute />} />
        <Route path="/page/:slug" element={<PageView />} />
        <Route path="/account" element={<Account />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/admin/*"
          element={
            <Suspense fallback={<div className="page-loading">Loading admin…</div>}>
              <Admin />
            </Suspense>
          }
        />
        <Route path="/:slug" element={<SlugRoute />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      </Suspense>
      <Dialogs />
      <Toasts />
      <CookieBanner />
    </>
  )
}
