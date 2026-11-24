import { useState } from 'react'
import Home from './pages/Home'
import Session from './pages/Session'
import Review from './pages/Review'

function App() {
  const [page, setPage] = useState('home')
  const [mode, setMode] = useState('free_talk')
  const [messages, setMessages] = useState([])

  function startSession(newMode) {
    setMode(newMode)
    setPage('session')
  }

  function endSession(sessionMessages) {
    setMessages(sessionMessages)
    setPage('review')
  }

  if (page === 'session') {
    return <Session mode={mode} onEnd={endSession} />
  }

  if (page === 'review') {
    return <Review messages={messages} onHome={() => setPage('home')} />
  }

  return <Home onStart={startSession} />
}

export default App
