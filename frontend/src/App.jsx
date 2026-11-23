import { useEffect, useState } from 'react'

function App() {
  const [status, setStatus] = useState('checking...')

  useEffect(() => {
    fetch('/api/health')
      .then((res) => setStatus(res.ok ? 'online' : 'offline'))
      .catch(() => setStatus('offline'))
  }, [])

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-6">
      <div className="h-24 w-24 rounded-full bg-cyan-400" />
      <h1 className="text-4xl">Voca-AI</h1>
      <p className="text-sm text-slate-400">Backend: {status}</p>
    </div>
  )
}

export default App
