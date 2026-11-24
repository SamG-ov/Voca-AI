import Orb from '../components/Orb'

function Home({ onStart }) {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-8 px-6 text-center">
      <Orb status="idle" size="h-28 w-28" />
      <h1 className="text-5xl font-light">
        Voca<span className="text-cyan-400">-AI</span>
      </h1>
      <p className="text-slate-400">Practice speaking French with your own tutor</p>

      <button
        onClick={() => onStart('free_talk')}
        className="rounded-lg bg-cyan-400 px-6 py-3 font-medium text-slate-950 hover:bg-cyan-300"
      >
        Start free talk
      </button>
    </div>
  )
}

export default Home
