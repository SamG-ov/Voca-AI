import { useRef, useState } from 'react'
import { sendTurn } from '../api'
import useRecorder from '../hooks/useRecorder'
import useSpacebar from '../hooks/useSpacebar'

const STATUS_TEXT = {
  idle: 'Hold SPACE to talk',
  listening: 'Listening... release SPACE when you are done',
  thinking: 'Thinking...',
  speaking: 'Speaking...',
}

const CIRCLE_COLOR = {
  idle: 'bg-slate-700',
  listening: 'bg-cyan-400',
  thinking: 'bg-cyan-800',
  speaking: 'bg-cyan-500',
}

function Session({ mode, onEnd }) {
  const [status, setStatus] = useState('idle')
  const [messages, setMessages] = useState([])
  const [error, setError] = useState('')
  const startTimeRef = useRef(0)
  const { start, stop, micError } = useRecorder()

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
      const data = await sendTurn(audio, history, mode)

      setMessages([
        ...messages,
        { role: 'user', text: data.transcript, corrections: data.corrections },
        { role: 'assistant', text: data.reply, newVocab: data.new_vocab },
      ])

      setStatus('speaking')
      const player = new Audio('data:audio/mpeg;base64,' + data.audio)
      player.onended = () => setStatus('idle')
      player.play().catch(() => setStatus('idle'))
    } catch (err) {
      setError(err.message)
      setStatus('idle')
    }
  }

  useSpacebar(handlePress, handleRelease)

  return (
    <div className="mx-auto flex h-screen max-w-2xl flex-col items-center gap-6 p-6">
      <div className="flex w-full justify-end">
        <button
          onClick={() => onEnd(messages)}
          className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-cyan-400"
        >
          End session
        </button>
      </div>

      <div className={`h-32 w-32 rounded-full ${CIRCLE_COLOR[status]}`} />
      <p className="text-slate-400">{STATUS_TEXT[status]}</p>

      {micError && (
        <p className="text-rose-400">I can't use your microphone. Please allow it in the browser and reload.</p>
      )}
      {error && <p className="text-rose-400">{error}</p>}

      <div className="w-full flex-1 space-y-3 overflow-y-auto">
        {messages.map((message, index) => (
          <div key={index}>
            <p className={message.role === 'user' ? 'text-right' : 'text-cyan-300'}>{message.text}</p>

            {message.corrections &&
              message.corrections.map((correction, i) => (
                <p key={i} className="text-right text-sm text-amber-300">
                  {correction.original} → {correction.corrected}
                </p>
              ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export default Session
