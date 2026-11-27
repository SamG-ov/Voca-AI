import { useEffect, useState } from 'react'
import Home from './pages/Home'
import Login from './pages/Login'
import Session from './pages/Session'
import Drill from './pages/Drill'
import Review from './pages/Review'
import { unlockAudio } from './audio'
import { checkPassword } from './api'

const DEFAULT_SETTINGS = { voice: 'denise', speed: '-10%' }

// settings are saved in the browser so they stay after a reload
function loadSettings() {
  const saved = localStorage.getItem('voca-settings')
  if (!saved) {
    return DEFAULT_SETTINGS
  }
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }
  } catch {
    return DEFAULT_SETTINGS
  }
}

function App() {
  const [page, setPage] = useState('home')
  const [session, setSession] = useState(null)
  const [result, setResult] = useState(null)
  const [settings, setSettings] = useState(loadSettings)
  // null while we're still checking the saved password
  const [loggedIn, setLoggedIn] = useState(null)

  useEffect(() => {
    checkPassword()
      .then((ok) => setLoggedIn(ok))
      // if the backend is down, let the home page show that error instead
      .catch(() => setLoggedIn(true))
  }, [])

  function changeSettings(newSettings) {
    setSettings(newSettings)
    localStorage.setItem('voca-settings', JSON.stringify(newSettings))
  }

  function startSession(newSession) {
    // this runs right after a tap, so it's the moment to allow sound on phones
    unlockAudio()
    setSession({ ...newSession, voice: settings.voice, speed: settings.speed })
    if (newSession.mode === 'drill') {
      setPage('drill')
    } else {
      setPage('session')
    }
  }

  function endSession(sessionResult) {
    setResult(sessionResult)
    setPage('review')
  }

  if (loggedIn === null) {
    return null
  }

  if (!loggedIn) {
    return <Login onLogin={() => setLoggedIn(true)} />
  }

  if (page === 'session') {
    return <Session session={session} onEnd={endSession} />
  }

  if (page === 'drill') {
    return <Drill session={session} onEnd={endSession} />
  }

  if (page === 'review') {
    return <Review session={session} result={result} onHome={() => setPage('home')} />
  }

  return <Home onStart={startSession} settings={settings} onSettingsChange={changeSettings} />
}

export default App
