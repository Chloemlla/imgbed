// main.tsx or main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { NextUIProvider } from '@nextui-org/react'
// Removed react-hot-toast in favor of custom Notification system
import { NotificationProvider } from './components/Notification'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <NextUIProvider>
      <NotificationProvider>
        <App />
      </NotificationProvider>
    </NextUIProvider>
  </React.StrictMode>,
)
