// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './app/App.tsx' // หรือ path ที่คุณวาง App ไว้
import './index.css' // 👈👈👈 บรรทัดนี้หายไปชัวร์! ต้องใส่ครับ

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)