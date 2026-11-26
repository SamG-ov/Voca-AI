import { useEffect, useRef, useState } from 'react'
import { getReview } from '../api'
import CorrectionCard from '../components/CorrectionCard'

function Review({ session, result, onHome }) {
  const [review, setReview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const startedRef = useRef(false)

  const userMessages = result.messages.filter((message) => message.role === 'user')
  const drillScores = result.drillScores

  // collect all corrections and new words from the conversation, without repeats
  const corrections = []
  const newWords = []
  for (const message of result.messages) {
    if (message.role === 'user') {
      for (const correction of message.corrections) {
        const alreadySaved = corrections.some(
          (saved) => saved.original === correction.original && saved.corrected === correction.corrected,
        )
        if (!alreadySaved) {
          corrections.push(correction)
        }
      }
    } else {
      for (const word of message.newVocab) {
        if (!newWords.some((saved) => saved.word === word.word)) {
          newWords.push(word)
        }
      }
    }
  }

  let averageScore = 0
  if (drillScores.length > 0) {
    const total = drillScores.reduce((sum, attempt) => sum + attempt.score, 0)
    averageScore = Math.round(total / drillScores.length)
  }

  // ask the tutor for a review (only once, React runs effects twice in dev mode)
  useEffect(() => {
    if (startedRef.current || userMessages.length === 0) return
    startedRef.current = true

    setLoading(true)
    getReview(result.messages, corrections)
      .then((data) => setReview(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function download() {
    const markdown = makeMarkdown(session, review, corrections, newWords, drillScores, averageScore)
    const file = new Blob([markdown], { type: 'text/markdown' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(file)
    link.download = `voca-ai-review-${new Date().toISOString().slice(0, 10)}.md`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  const nothingToReview = userMessages.length === 0 && drillScores.length === 0

  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-6 px-4 py-10 sm:gap-8 sm:px-6 sm:py-12">
      <div className="text-center">
        <h1 className="text-4xl font-light">Session review</h1>
        <p className="mt-2 text-slate-400">
          {session.title} · {new Date().toLocaleDateString()}
        </p>
      </div>

      {nothingToReview && (
        <p className="text-center text-slate-400">You didn't say anything this time, so there's nothing to review.</p>
      )}

      {loading && <p className="animate-pulse text-center text-slate-400">Your tutor is writing your review...</p>}
      {error && <p className="text-center text-rose-400">{error}</p>}

      {review && (
        <>
          <Section title="How it went">
            <p className="text-slate-200">{review.summary}</p>
          </Section>

          <Section title="What went well">
            <ul className="space-y-2">
              {review.good_points.map((point, index) => (
                <li key={index} className="text-emerald-300">
                  + {point}
                </li>
              ))}
            </ul>
          </Section>

          <Section title="What to work on">
            <ul className="space-y-2">
              {review.tips.map((tip, index) => (
                <li key={index} className="text-amber-200">
                  → {tip}
                </li>
              ))}
            </ul>
          </Section>
        </>
      )}

      {userMessages.length > 0 && (
        <Section title={`Mistakes (${corrections.length})`}>
          {corrections.length === 0 && <p className="text-slate-400">No mistakes this time. Bravo !</p>}
          <div className="grid gap-3 sm:grid-cols-2">
            {corrections.map((correction, index) => (
              <CorrectionCard key={index} correction={correction} />
            ))}
          </div>
        </Section>
      )}

      {newWords.length > 0 && (
        <Section title={`New words (${newWords.length})`}>
          <div className="flex flex-wrap gap-2">
            {newWords.map((word, index) => (
              <span key={index} className="rounded-full bg-slate-800 px-3 py-1 text-sm">
                <span className="text-cyan-300">{word.word}</span> = {word.translation}
              </span>
            ))}
          </div>
        </Section>
      )}

      {drillScores.length > 0 && (
        <Section title={`Repeat after me · average ${averageScore}%`}>
          <ul className="space-y-3">
            {drillScores.map((attempt, index) => (
              <li key={index} className="flex justify-between gap-4">
                <div>
                  <p>{attempt.sentence}</p>
                  {attempt.missed.length > 0 && (
                    <p className="text-sm text-rose-400">Missed: {attempt.missed.join(', ')}</p>
                  )}
                </div>
                <span className={attempt.score >= 90 ? 'text-emerald-400' : 'text-amber-300'}>{attempt.score}%</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <div className="flex flex-wrap justify-center gap-3 pb-8">
        {!nothingToReview && (
          <button
            onClick={download}
            disabled={loading}
            className="rounded-lg border border-slate-700 px-6 py-3 hover:border-cyan-400 disabled:opacity-40"
          >
            Download review
          </button>
        )}
        <button
          onClick={onHome}
          className="rounded-lg bg-cyan-400 px-6 py-3 font-medium text-slate-950 hover:bg-cyan-300"
        >
          Back to home
        </button>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <h2 className="mb-4 text-sm tracking-widest text-slate-500 uppercase">{title}</h2>
      {children}
    </section>
  )
}

function makeMarkdown(session, review, corrections, newWords, drillScores, averageScore) {
  let text = `# Voca-AI review\n\n${session.title} · ${new Date().toLocaleDateString()}\n\n`

  if (review) {
    text += `## How it went\n\n${review.summary}\n\n`
    text += '## What went well\n\n'
    for (const point of review.good_points) {
      text += `- ${point}\n`
    }
    text += '\n## What to work on\n\n'
    for (const tip of review.tips) {
      text += `- ${tip}\n`
    }
    text += '\n'
  }

  if (corrections.length > 0) {
    text += '## Mistakes\n\n'
    for (const correction of corrections) {
      text += `- ~~${correction.original}~~ → **${correction.corrected}** (${correction.explanation})\n`
    }
    text += '\n'
  }

  if (newWords.length > 0) {
    text += '## New words\n\n'
    for (const word of newWords) {
      text += `- **${word.word}** = ${word.translation}\n`
    }
    text += '\n'
  }

  if (drillScores.length > 0) {
    text += `## Repeat after me (average ${averageScore}%)\n\n`
    for (const attempt of drillScores) {
      text += `- ${attempt.score}% · ${attempt.sentence}`
      if (attempt.missed.length > 0) {
        text += ` (missed: ${attempt.missed.join(', ')})`
      }
      text += '\n'
    }
  }

  return text
}

export default Review
