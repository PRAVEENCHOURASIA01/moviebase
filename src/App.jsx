import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { ToastProvider } from '@/context/ToastContext'
import { Navbar } from '@/components/Navbar'
import { AuthModal } from '@/components/AuthModal'
import Home from '@/pages/Home'
import Profile from '@/pages/Profile'
import PublicProfile from '@/pages/PublicProfile'
import NotFound from '@/pages/NotFound'
import { ROUTES } from '@/lib/routes'

// ─────────────────────────────────────────
// App
// Root component — providers, router, layout
//
// Layout:
//   AuthProvider  (global auth state)
//   └── ToastProvider (global toast notifications)
//       ├── Navbar    (always visible)
//       ├── Routes    (page content)
//       └── AuthModal (triggered on demand, not on load)
// ─────────────────────────────────────────
const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <ToastProvider>
        {/* Global chrome */}
        <Navbar />
        <AuthModal />

        {/* Page routes */}
        <Routes>
          <Route path={ROUTES.HOME} element={<Home />} />
          <Route path={ROUTES.PROFILE} element={<Profile />} />
          <Route path={ROUTES.PUBLIC_PROFILE} element={<PublicProfile />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App