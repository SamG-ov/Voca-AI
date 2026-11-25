import { useEffect, useRef, useState } from 'react'
import { AnimatePresence } from 'motion/react'
import { sendTurn, startSession } from '../api'
import useRecorder from '../hooks/useRecorder'
import useSpacebar from '../hooks/useSpacebar'
import Orb from '../components/Orb'
import ChatMessage from '../components/ChatMessage'
import CorrectionCard from '../components/CorrectionCard'

function playAudio(base64Audio, onEnded) {
  const player = new Audio('data:audio/mpeg;base64,' + base64Audio)
  player.onended = onEnded
  player.play().catch(onEnded)
  return player
}

function Session({ session, onEnd }) {
  const [status, setStatus] = useState('thinking')
  const [messages, setMessages] = useState([])
  const [error, setError] = useState('')
  const startTimeRef = useRef(0)
  const playerRef = useRef(null)
  const chatEndRef = useRef(null)
  const startedRef = useRef(false)
  const { start, stop, getVolume, micError } = useRecorder()

  // the tutor says the first line
  useEffect(() => {
    // React runs effects twice in dev mode, so make sure we only start once
    if (startedRef.current) return
    startedRef.current = true

    startSession(session)
      .then((data) => {
        setMessages([{ role: 'assistant', text: data.reply, newVocab: data.new_vocab }])
        setStatus('speaking')
        playerRef.current = playAudio(data.audio, () => setStatus('idle'))
      })
      .catch((err) => {
        setError(err.message)
        setStatus('idle')
      })
  }, [session])

  // scroll down to the newest message
  useEffect(() => {
    chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handlePress() {
    if (status !== 'idle') return

    if (start()) {
      startTimeRef.current = Date.now()
      setError('')
      setStatus('listening')
    }
  }

  async function handleRelease() {
    if (status !== 'listening') return

    const audio = await stop()

    // a very short tap is probably a mistake
    if (Date.now() - startTimeRef.current < 500) {
      setError('Hold SPACE a bit longer while you speak')
      setStatus('idle')
      return
    }

    setStatus('thinking')
    const history = messages.map((message) => ({ role: message.role, content: message.text }))

    try {
      const data = await sendTurn(audio, history, session)

      setMessages([
        ...messages,
        { role: 'user', text: data.transcript, corrections: data.corrections },
        { role: 'assistant', text: data.reply, newVocab: data.new_vocab },
      ])

      setStatus('speaking')
      playerRef.current = playAudio(data.audio, () => setStatus('idle'))
    } catch (err) {
      setError(err.message)
      setStatus('idle')
    }
  }

  function endSession() {
    if (playerRef.current) {
      playerRef.current.pause()
    }
    onEnd(messages)
  }

  useSpacebar(handlePress, handleRelease)

  // all corrections from the session, newest first
  const corrections = []
  messages.forEach((message, messageIndex) => {
    if (message.role === 'user') {
      message.corrections.forEach((correction, i) => {
        corrections.unshift({ ...correction, key: messageIndex + '-' + i })
      })
    }
  })

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b border-slate-800 px-4 py-3 lg:px-6 lg:py-4">
        <div className="flex items-center gap-4">
          <span className="text-lg font-light">
            Voca<span className="text-cyan-400">-AI</span>
          </span>
          <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-400">{session.title}</span>
        </div>
        <button
          onClick={endSession}
          className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-cyan-400"
        >
          End session
        </button>
      </header>

      {session.goal && (
        <div className="border-b border-slate-800 bg-cyan-400/5 px-4 py-2 text-center text-sm text-cyan-200 lg:px-6">
          Your goal: {session.goal}
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
        <main className="flex flex-1 flex-col items-center overflow-hidden px-6">
          <div className="py-6 lg:py-10">
            <Orb status={status} getVolume={getVolume} size="h-24 w-24 lg:h-40 lg:w-40" />
          </div>

          <StatusHint status={status} />
          {micError && (
            <p className="mt-2 text-rose-400">I can't use your microphone. Please allow it in the browser and reload.</p>
          )}
          {error && <p className="mt-2 text-rose-400">{error}</p>}

          <div className="mt-6 w-full max-w-2xl flex-1 space-y-4 overflow-y-auto pb-6">
            {messages.length === 0 && status === 'idle' && (
              <p className="text-center text-slate-500">Say "Bonjour !" to start the conversation.</p>
            )}
            {messages.map((message, index) => (
              <ChatMessage key={index} message={message} />
            ))}
            <div ref={chatEndRef} />
          </div>
        </main>

        <aside className="max-h-48 overflow-y-auto border-t border-slate-800 p-4 lg:max-h-none lg:p-6 lg:w-96 lg:border-t-0 lg:border-l">
          <h2 className="mb-4 text-sm tracking-widest text-slate-500 uppercase">Corrections</h2>
          {corrections.length === 0 && <p className="text-sm text-slate-500">Your corrections will show up here.</p>}
          <div className="space-y-3">
            <AnimatePresence>
              {corrections.map((correction) => (
                <CorrectionCard key={correction.key} correction={correction} />
              ))}
            </AnimatePresence>
          </div>
        </aside>
      </div>
    </div>
  )
}

function StatusHint({ status }) {
  if (status === 'idle') {
    return (
      <p className="text-slate-400">
        Hold <kbd className="rounded border border-slate-600 bg-slate-800 px-2 py-0.5 text-sm">SPACE</kbd> to talk
      </p>
    )
  }
  if (status === 'listening') {
    return <p className="text-cyan-300">Listening... release SPACE when you're done</p>
  }
  if (status === 'thinking') {
    return <p className="animate-pulse text-slate-400">Thinking...</p>
  }
  return <p className="text-slate-400">Speaking...</p>
}

export default Session
