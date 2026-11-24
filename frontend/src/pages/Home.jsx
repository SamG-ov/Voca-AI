function Home({ onStart }) {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-8">
      <div className="h-24 w-24 rounded-full bg-cyan-400" />
      <h1 className="text-5xl font-light">Voca-AI</h1>
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
