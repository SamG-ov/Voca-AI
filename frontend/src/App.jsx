import { useState } from 'react'
import Home from './pages/Home'
import Session from './pages/Session'
import Drill from './pages/Drill'
import Review from './pages/Review'

function App() {
  const [page, setPage] = useState('home')
  const [session, setSession] = useState(null)
  const [result, setResult] = useState(null)

  function startSession(newSession) {
    setSession(newSession)
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

  if (page === 'session') {
    return <Session session={session} onEnd={endSession} />
  }

  if (page === 'drill') {
    return <Drill onEnd={endSession} />
  }

  if (page === 'review') {
    return <Review result={result} onHome={() => setPage('home')} />
  }

  return <Home onStart={startSession} />
}

export default App
