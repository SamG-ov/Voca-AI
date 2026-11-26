import { useEffect, useRef, useState } from 'react'
import { AnimatePresence } from 'motion/react'
import { sendTurn, startSession } from '../api'
import useRecorder from '../hooks/useRecorder'
import useSpacebar from '../hooks/useSpacebar'
import Orb from '../components/Orb'
import ChatMessage from '../components/ChatMessage'
import CorrectionCard from '../components/CorrectionCard'
import MicButton from '../components/MicButton'
import StatusHint from '../components/StatusHint'
import { playAudio, stopAudio, unlockAudio } from '../audio'

function Session({ session, onEnd }) {
  const [status, setStatus] = useState('thinking')
  const [messages, setMessages] = useState([])
  const [error, setError] = useState('')
  const [showCorrections, setShowCorrections] = useState(false)
  const startTimeRef = useRef(0)
  const chatEndRef = useRef(null)
  const startedRef = useRef(false)
  const endedRef = useRef(false)
  const { start, stop, getVolume, micError } = useRecorder()

  // the tutor says the first line
  useEffect(() => {
    // React runs effects twice in dev mode, so make sure we only start once
    if (startedRef.current) return
    startedRef.current = true

    startSession(session)
      .then((data) => {
        // the session was ended while we were waiting, so don't start talking
        if (endedRef.current) return
        setMessages([{ role: 'assistant', text: data.reply, newVocab: data.new_vocab }])
        setStatus('speaking')
        playAudio(data.audio, () => setStatus('idle'))
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

  function startTalking() {
    if (status !== 'idle') return

    if (start()) {
      startTimeRef.current = Date.now()
      setError('')
      setStatus('listening')
    }
  }

  async function stopTalking() {
    if (status !== 'listening') return

    const audio = await stop()

    // a very short recording is probably a mistake
    if (Date.now() - startTimeRef.current < 500) {
      setError('That was too short. Speak a little longer before you stop.')
      setStatus('idle')
      return
    }

    setStatus('thinking')
    const history = messages.map((message) => ({ role: message.role, content: message.text }))

    try {
      const data = await sendTurn(audio, history, session)
      if (endedRef.current) return

      setMessages([
        ...messages,
        { role: 'user', text: data.transcript, corrections: data.corrections },
        { role: 'assistant', text: data.reply, newVocab: data.new_vocab },
      ])

      setStatus('speaking')
      playAudio(data.audio, () => setStatus('idle'))
    } catch (err) {
      setError(err.message)
      setStatus('idle')
    }
  }

  // on a phone: tap once to start, tap again to stop
  function handleMicTap() {
    unlockAudio()
    if (status === 'idle') {
      startTalking()
    } else if (status === 'listening') {
      stopTalking()
    }
  }

  // on a computer: hold space to talk
  useSpacebar(startTalking, stopTalking)

  function endSession() {
    endedRef.current = true
    stopAudio()
    onEnd({ messages: messages, drillScores: [] })
  }

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
    <div className="flex h-dvh flex-col">
      <header className="flex items-center justify-between gap-3 border-b border-slate-800 px-4 py-3 lg:px-6 lg:py-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="hidden text-lg font-light sm:inline">
            Voca<span className="text-cyan-400">-AI</span>
          </span>
          <span className="truncate rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-400">{session.title}</span>
        </div>
        <button
          onClick={endSession}
          className="shrink-0 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-cyan-400"
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
        <main className="flex flex-1 flex-col items-center overflow-hidden px-4 lg:px-6">
          <div className="py-4 lg:py-10">
            <Orb status={status} getVolume={getVolume} size="h-20 w-20 lg:h-40 lg:w-40" />
          </div>

          <StatusHint status={status} idleText="to talk" />
          {micError && (
            <p className="mt-2 text-center text-rose-400">
              I can't use your microphone. Allow it in the browser and reload (on a phone the page has to be on https).
            </p>
          )}
          {error && <p className="mt-2 text-center text-rose-400">{error}</p>}

          <div className="mt-4 w-full max-w-2xl flex-1 space-y-4 overflow-y-auto pb-4 lg:mt-6">
            {messages.length === 0 && status === 'idle' && (
              <p className="text-center text-slate-500">Say "Bonjour !" to start the conversation.</p>
            )}
            {messages.map((message, index) => (
              <ChatMessage key={index} message={message} />
            ))}
            <div ref={chatEndRef} />
          </div>

          <div className="flex w-full max-w-2xl items-center justify-center gap-4 border-t border-slate-800 py-4">
            {/* on phones the corrections open on top of the chat */}
            <button
              onClick={() => setShowCorrections(true)}
              className="w-28 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 lg:hidden"
            >
              Corrections ({corrections.length})
            </button>
            <MicButton status={status} onTap={handleMicTap} />
            <div className="w-28 lg:hidden" />
          </div>
        </main>

        <aside
          className={`${showCorrections ? 'fixed inset-0 z-20' : 'hidden'} overflow-y-auto bg-slate-950 p-6 lg:static lg:block lg:w-96 lg:border-l lg:border-slate-800`}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm tracking-widest text-slate-500 uppercase">Corrections</h2>
            <button onClick={() => setShowCorrections(false)} className="text-sm text-cyan-300 lg:hidden">
              Close
            </button>
          </div>
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

export default Session
