import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import Lister from './pages/Lister.jsx'
import Shopper from './pages/Shopper.jsx'
import Summary from './pages/Summary.jsx'
import './index.css'


ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/lister" element={<Lister />} />
      <Route path="/shopper" element={<Shopper />} />
      <Route path="/summary/:sessionId" element={<Summary />} />
    </Routes>
  </BrowserRouter>
)

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js");
}

