// Tap once to start talking, tap again to stop
function MicButton({ status, onTap }) {
  const listening = status === 'listening'
  const disabled = status !== 'idle' && status !== 'listening'

  return (
    <button
      onClick={onTap}
      disabled={disabled}
      aria-label={listening ? 'Stop talking' : 'Start talking'}
      className={`flex h-16 w-16 touch-manipulation items-center justify-center rounded-full select-none disabled:opacity-30 ${
        listening ? 'animate-pulse bg-rose-500' : 'bg-cyan-400 hover:bg-cyan-300'
      }`}
    >
      {listening ? (
        // stop icon
        <span className="h-5 w-5 rounded-sm bg-white" />
      ) : (
        // microphone icon
        <svg viewBox="0 0 24 24" className="h-7 w-7 fill-slate-950">
          <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3z" />
          <path d="M17 11a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.9V21h2v-3.1A7 7 0 0 0 19 11z" />
        </svg>
      )}
    </button>
  )
}

export default MicButton
