function Review({ messages, onHome }) {
  const myMessages = messages.filter((message) => message.role === 'user')

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-6">
      <h1 className="text-4xl font-light">Session finished</h1>
      <p className="text-slate-400">You spoke {myMessages.length} times. The full review is coming soon.</p>

      <button
        onClick={onHome}
        className="rounded-lg bg-cyan-400 px-6 py-3 font-medium text-slate-950 hover:bg-cyan-300"
      >
        Back to home
      </button>
    </div>
  )
}

export default Review
