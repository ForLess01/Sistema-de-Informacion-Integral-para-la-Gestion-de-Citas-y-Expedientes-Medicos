import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './renderer/index.css'
import App from './renderer/App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)