import { useState } from 'react'
import { checkPassword, savePassword } from '../api'
import Orb from '../components/Orb'

function Login({ onLogin }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setChecking(true)
    setError('')

    savePassword(password)
    try {
      if (await checkPassword()) {
        onLogin()
      } else {
        setError('Wrong password')
      }
    } catch {
      setError('Could not reach the backend. Is it running?')
    }
    setChecking(false)
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 px-4 text-center">
      <Orb status="idle" size="h-24 w-24" />
      <h1 className="text-4xl font-light sm:text-5xl">
        Voca<span className="text-cyan-400">-AI</span>
      </h1>

      <form onSubmit={handleSubmit} className="flex w-full max-w-xs flex-col gap-3">
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password"
          autoFocus
          className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 focus:border-cyan-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={checking || password === ''}
          className="rounded-lg bg-cyan-400 px-6 py-3 font-medium text-slate-950 hover:bg-cyan-300 disabled:opacity-40"
        >
          {checking ? 'Checking...' : 'Enter'}
        </button>
        {error && <p className="text-rose-400">{error}</p>}
      </form>
    </div>
  )
}

export default Login
