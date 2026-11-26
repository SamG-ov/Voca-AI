import { isTouchScreen } from '../device'

// The small text under the orb that tells you what to do
function StatusHint({ status, idleText }) {
  if (status === 'listening') {
    if (isTouchScreen) {
      return <p className="text-cyan-300">Listening... tap again when you're done</p>
    }
    return <p className="text-cyan-300">Listening... release SPACE when you're done</p>
  }
  if (status === 'thinking') {
    return <p className="animate-pulse text-slate-400">One moment...</p>
  }
  if (status === 'speaking') {
    return <p className="text-slate-400">Speaking...</p>
  }

  if (isTouchScreen) {
    return <p className="text-slate-400">Tap the mic {idleText}</p>
  }
  return (
    <p className="text-slate-400">
      Hold <kbd className="rounded border border-slate-600 bg-slate-800 px-2 py-0.5 text-sm">SPACE</kbd> or click the
      mic {idleText}
    </p>
  )
}

export default StatusHint
