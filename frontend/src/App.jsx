import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Upload from './pages/Upload'
import Results from './pages/Results'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Pricing from './pages/Pricing'
import Return from './pages/Return'
import Settings from './pages/Settings'
import Waitlist from './pages/Waitlist'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'

// Apply theme before first render to avoid flash.
// We intentionally default to 'light' here and do NOT check the system/OS
// preference — dark mode should only ever be set by explicit user choice
// (stored in localStorage), never automatically from the device's settings.
const stored = localStorage.getItem('cviq:theme')
document.documentElement.setAttribute('data-theme', stored === 'dark' ? 'dark' : 'light')

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/results" element={<Results />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/return" element={<Return />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/waitlist" element={<Waitlist />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App