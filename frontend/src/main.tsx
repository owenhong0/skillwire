import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles/skillwire.css'
import './styles/news.css'

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
