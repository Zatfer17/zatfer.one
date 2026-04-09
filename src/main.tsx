import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import TapePage from './pages/TapePage.tsx'

function getTapeIdFromPath(pathname: string): number | null {
  const match = pathname.match(/^\/tape\/(\d+)\/?$/)
  if (!match) return null
  const tapeId = Number(match[1])
  return Number.isInteger(tapeId) ? tapeId : null
}

function AppRouter() {
  const tapeId = getTapeIdFromPath(window.location.pathname)
  if (tapeId !== null) {
    return <TapePage tapeId={tapeId} />
  }
  return <App />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppRouter />
  </StrictMode>,
)
