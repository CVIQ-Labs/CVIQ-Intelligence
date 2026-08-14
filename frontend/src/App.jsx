import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

const Home = lazy(() => import('./pages/Home'))
const Upload = lazy(() => import('./pages/Upload'))
const Results = lazy(() => import('./pages/Results'))
const Login = lazy(() => import('./pages/Login'))
const Signup = lazy(() => import('./pages/Signup'))
const Pricing = lazy(() => import('./pages/Pricing'))
const Return = lazy(() => import('./pages/Return'))
const Settings = lazy(() => import('./pages/Settings'))
const Waitlist = lazy(() => import('./pages/Waitlist'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const Terms = lazy(() => import('./pages/Terms'))

// Apply theme before first render to avoid flash.
// We intentionally default to 'light' here and do NOT check the system/OS
// preference — dark mode should only ever be set by explicit user choice
// (stored in localStorage), never automatically from the device's settings.
const stored = localStorage.getItem('cviq:theme')
document.documentElement.setAttribute('data-theme', stored === 'dark' ? 'dark' : 'light')

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={null}>
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
          <Route path="/terms" element={<Terms />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App