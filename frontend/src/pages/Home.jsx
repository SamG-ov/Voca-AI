import { useEffect, useState } from 'react'
import { getModes } from '../api'
import Orb from '../components/Orb'
import Settings from '../components/Settings'

function Home({ onStart, settings, onSettingsChange }) {
  // which list is open: none, scenarios or topics
  const [picking, setPicking] = useState('')
  const [scenarios, setScenarios] = useState({})
  const [topics, setTopics] = useState({})
  const [error, setError] = useState('')

  useEffect(() => {
    getModes()
      .then((data) => {
        setScenarios(data.scenarios)
        setTopics(data.topics)
      })
      .catch((err) => setError(err.message))
  }, [])

  function startFreeTalk() {
    onStart({ mode: 'free_talk', option: '', title: 'Free talk', goal: '' })
  }

  function startScenario(key) {
    const scenario = scenarios[key]
    onStart({ mode: 'scenario', option: key, title: scenario.title, goal: scenario.goal })
  }

  function startTopic(key) {
    onStart({ mode: 'topic', option: key, title: topics[key], goal: '' })
  }

  function startRandomTopic() {
    const keys = Object.keys(topics)
    const randomKey = keys[Math.floor(Math.random() * keys.length)]
    startTopic(randomKey)
  }

  return (
    <div className="flex min-h-dvh flex-col items-center gap-8 px-4 py-10 text-center sm:px-6 sm:py-16">
      <Orb status="idle" size="h-24 w-24" />
      <div>
        <h1 className="text-4xl font-light sm:text-5xl">
          Voca<span className="text-cyan-400">-AI</span>
        </h1>
        <p className="mt-3 text-slate-400">Practice speaking French with your own tutor</p>
      </div>

      {error && <p className="text-rose-400">{error}</p>}

      <div className="grid w-full max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ModeCard
          title="Free talk"
          text="Chat about anything, like with a friend."
          active={false}
          onClick={startFreeTalk}
        />
        <ModeCard
          title="Scenario"
          text="Role-play real situations: café, hotel, doctor..."
          active={picking === 'scenarios'}
          onClick={() => setPicking('scenarios')}
        />
        <ModeCard
          title="Topic"
          text="Pick a topic and give your opinion."
          active={picking === 'topics'}
          onClick={() => setPicking('topics')}
        />
        <ModeCard
          title="Repeat after me"
          text="Listen to a sentence and say it back."
          active={false}
          onClick={() => onStart({ mode: 'drill', option: '', title: 'Repeat after me', goal: '' })}
        />
      </div>

      {picking !== '' && Object.keys(scenarios).length === 0 && !error && (
        <p className="animate-pulse text-slate-400">Loading...</p>
      )}

      {picking === 'scenarios' && (
        <div className="grid w-full max-w-3xl gap-3 sm:grid-cols-2">
          {Object.keys(scenarios).map((key) => (
            <button
              key={key}
              onClick={() => startScenario(key)}
              className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-left hover:border-cyan-400"
            >
              <p className="font-medium">{scenarios[key].title}</p>
              <p className="mt-1 text-sm text-slate-400">{scenarios[key].goal}</p>
            </button>
          ))}
        </div>
      )}

      {picking === 'topics' && (
        <div className="flex w-full max-w-3xl flex-wrap justify-center gap-3">
          <button
            onClick={startRandomTopic}
            className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-cyan-300"
          >
            Random topic
          </button>
          {Object.keys(topics).map((key) => (
            <button
              key={key}
              onClick={() => startTopic(key)}
              className="rounded-full border border-slate-700 px-4 py-2 text-sm hover:border-cyan-400"
            >
              {topics[key]}
            </button>
          ))}
        </div>
      )}

      <Settings settings={settings} onChange={onSettingsChange} />
    </div>
  )
}

function ModeCard({ title, text, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-2xl border bg-slate-900 p-6 text-left hover:border-cyan-400 ${
        active ? 'border-cyan-400' : 'border-slate-800'
      }`}
    >
      <p className="text-lg font-medium">{title}</p>
      <p className="mt-2 text-sm text-slate-400">{text}</p>
    </button>
  )
}

export default Home
