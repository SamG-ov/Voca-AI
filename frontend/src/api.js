export async function sendTurn(audioBlob, history, mode) {
  const form = new FormData()
  form.append('audio', audioBlob, 'recording.webm')
  form.append('history', JSON.stringify(history))
  form.append('mode', mode)

  let res
  try {
    res = await fetch('/api/turn', { method: 'POST', body: form })
  } catch {
    throw new Error('Could not reach the backend. Is it running?')
  }

  if (!res.ok) {
    let message = 'Something went wrong, try again'
    try {
      const data = await res.json()
      if (typeof data.detail === 'string') {
        message = data.detail
      }
    } catch {
      message = 'Could not reach the backend. Is it running?'
    }
    throw new Error(message)
  }

  return res.json()
}
