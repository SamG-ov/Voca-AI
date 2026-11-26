import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { checkDrill, getDrillSentence } from '../api'
import { playAudio } from '../audio'
import useRecorder from '../hooks/useRecorder'
import useSpacebar from '../hooks/useSpacebar'
import Orb from '../components/Orb'

function Drill({ session, onEnd }) {
  const [status, setStatus] = useState('thinking')
  const [sentence, setSentence] = useState('')
  const [sentenceAudio, setSentenceAudio] = useState('')
  const [result, setResult] = useState(null)
  const [scores, setScores] = useState([])
  const [hideText, setHideText] = useState(false)
  const [error, setError] = useState('')
  const startTimeRef = useRef(0)
  const playerRef = useRef(null)
  const startedRef = useRef(false)
  const endedRef = useRef(false)
  const { start, stop, getVolume, micError } = useRecorder()

  function speak(audio) {
    setStatus('speaking')
    playerRef.current = playAudio(audio, () => setStatus('idle'))
  }

  function nextSentence() {
    setStatus('thinking')
    setResult(null)
    setError('')

    getDrillSentence(sentence, session)
      .then((data) => {
        // the drill was ended while we were waiting, so don't start talking
        if (endedRef.current) return
        setSentence(data.sentence)
        setSentenceAudio(data.audio)
        speak(data.audio)
      })
      .catch((err) => {
        setError(err.message)
        setStatus('idle')
      })
  }

  // load the first sentence (only once, React runs effects twice in dev mode)
  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true
    nextSentence()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handlePress() {
    if (status !== 'idle' || sentence === '') return

    if (start()) {
      startTimeRef.current = Date.now()
      setResult(null)
      setError('')
      setStatus('listening')
    }
  }

  async function handleRelease() {
    if (status !== 'listening') return

    const audio = await stop()

    if (Date.now() - startTimeRef.current < 500) {
      setError('Hold SPACE a bit longer while you speak')
      setStatus('idle')
      return
    }

    setStatus('thinking')
    try {
      const data = await checkDrill(audio, sentence)
      setResult(data)
      // keep the missed words for the review, without commas and full stops
      const missed = data.words.filter((word) => !word.correct).map((word) => word.word.replace(/[.,!?;:]/g, ''))
      setScores([...scores, { sentence: sentence, score: data.score, missed: missed }])
    } catch (err) {
      setError(err.message)
    }
    setStatus('idle')
  }

  useSpacebar(handlePress, handleRelease)

  function endDrill() {
    endedRef.current = true
    if (playerRef.current) {
      playerRef.current.pause()
    }
    onEnd({ messages: [], drillScores: scores })
  }

  let scoreColor = 'text-rose-400'
  if (result && result.score >= 90) {
    scoreColor = 'text-emerald-400'
  } else if (result && result.score >= 60) {
    scoreColor = 'text-amber-300'
  }

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b border-slate-800 px-4 py-3 lg:px-6 lg:py-4">
        <div className="flex items-center gap-4">
          <span className="text-lg font-light">
            Voca<span className="text-cyan-400">-AI</span>
          </span>
          <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-400">Repeat after me</span>
        </div>
        <button
          onClick={endDrill}
          className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-cyan-400"
        >
          End session
        </button>
      </header>

      <main className="flex flex-1 flex-col items-center overflow-y-auto px-6 py-8 text-center">
        <Orb status={status} getVolume={getVolume} size="h-24 w-24 lg:h-32 lg:w-32" />

        <div className="mt-8 min-h-24 max-w-2xl">
          {result && (
            <p className="text-2xl leading-relaxed lg:text-3xl">
              {result.words.map((word, index) => (
                <span key={index}>
                  <span className={word.correct ? 'text-emerald-300' : 'text-rose-400 underline'}>
                    {word.word}
                  </span>{' '}
                </span>
              ))}
            </p>
          )}
          {!result && !hideText && <p className="text-2xl leading-relaxed lg:text-3xl">{sentence}</p>}
          {!result && hideText && sentence && <p className="text-2xl text-slate-600">Listen carefully...</p>}
        </div>

        {result && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
            <p className={`text-5xl font-light ${scoreColor}`}>{result.score}%</p>
            <p className="mt-2 text-sm text-slate-400">I heard: "{result.heard}"</p>
          </motion.div>
        )}

        <div className="mt-6">
          <DrillHint status={status} hasResult={result !== null} />
        </div>
        {micError && (
          <p className="mt-2 text-rose-400">I can't use your microphone. Please allow it in the browser and reload.</p>
        )}
        {error && <p className="mt-2 text-rose-400">{error}</p>}

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => speak(sentenceAudio)}
            disabled={status !== 'idle' || !sentenceAudio}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:border-cyan-400 disabled:opacity-40"
          >
            Listen again
          </button>
          <button
            onClick={() => setResult(null)}
            disabled={status !== 'idle' || !result}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:border-cyan-400 disabled:opacity-40"
          >
            Try again
          </button>
          <button
            onClick={nextSentence}
            disabled={status !== 'idle'}
            className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-cyan-300 disabled:opacity-40"
          >
            Next sentence
          </button>
        </div>

        <label className="mt-6 flex items-center gap-2 text-sm text-slate-400">
          <input type="checkbox" checked={hideText} onChange={(event) => setHideText(event.target.checked)} />
          Hide the sentence (listening practice)
        </label>
      </main>
    </div>
  )
}

function DrillHint({ status, hasResult }) {
  if (status === 'listening') {
    return <p className="text-cyan-300">Listening... release SPACE when you're done</p>
  }
  if (status === 'thinking') {
    return <p className="animate-pulse text-slate-400">One moment...</p>
  }
  if (status === 'speaking') {
    return <p className="text-slate-400">Listen...</p>
  }
  return (
    <p className="text-slate-400">
      Hold <kbd className="rounded border border-slate-600 bg-slate-800 px-2 py-0.5 text-sm">SPACE</kbd>{' '}
      {hasResult ? 'to try again' : 'and repeat the sentence'}
    </p>
  )
}

export default Drill
