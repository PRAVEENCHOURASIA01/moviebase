import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { ToastProvider } from '@/context/ToastContext'
import { Navbar } from '@/components/Navbar'
import { AuthModal } from '@/components/AuthModal'
import { ROUTES } from '@/lib/routes'

// ── Lazy-loaded pages (P2 Code Splitting) ──
const Home = lazy(() => import('@/pages/Home'))
const Profile = lazy(() => import('@/pages/Profile'))
const PublicProfile = lazy(() => import('@/pages/PublicProfile'))
const SharedProfile = lazy(() => import('@/pages/SharedProfile'))
const NotFound = lazy(() => import('@/pages/NotFound'))

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center pt-16">
    <div className="w-10 h-10 border-2 border-brand border-t-transparent rounded-full animate-spin" />
  </div>
)

// ─────────────────────────────────────────
// App
// Root component — providers, router, layout
// ─────────────────────────────────────────
const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <ToastProvider>
        {/* Global chrome */}
        <Navbar />
        <AuthModal />

        {/* Page routes with Suspense */}
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path={ROUTES.HOME} element={<Home />} />
            <Route path={ROUTES.PROFILE} element={<Profile />} />
            <Route path={ROUTES.SHARE} element={<SharedProfile />} />
            <Route path={ROUTES.PUBLIC_PROFILE} element={<PublicProfile />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </ToastProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App