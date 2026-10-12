import { lazy, Suspense } from 'react'
import { Route, Routes, useParams } from 'react-router-dom'
import Home from './pages/Home'
import SlugRoute from './pages/SlugRoute'
import Gallery from './pages/Gallery'
import Embed from './pages/Embed'
import PageView from './pages/PageView'
import Account from './pages/Account'
import ResetPassword from './pages/ResetPassword'
import NotFound from './pages/NotFound'
import TeamPicker from './pages/TeamPicker'
import Dialogs from './components/Dialogs'
import Toasts from './components/Toasts'

const Admin = lazy(() => import('./pages/admin/Admin'))

function EmbedRoute() {
  const { code } = useParams()
  return <Embed code={code} />
}

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/team-picker" element={<TeamPicker />} />
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
      <Dialogs />
      <Toasts />
    </>
  )
}
