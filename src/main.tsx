import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from 'react-error-boundary'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary fallback={
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Something went wrong</h2>
        <button onClick={() => window.location.href = '/'}>Go home</button>
      </div>
    }>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
