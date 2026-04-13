import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from '@/App'
import '@/index.css'

// ─────────────────────────────────────────
// Entry Point
// StrictMode enabled — surfaces React issues
// early in development without affecting prod.
// ─────────────────────────────────────────
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)