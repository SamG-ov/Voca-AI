const BACKEND_DOWN = 'Could not reach the backend. Is it running?'

// Sends a request and turns any problem into an Error with a readable message
async function request(url, options) {
  let res
  try {
    res = await fetch(url, options)
  } catch {
    throw new Error(BACKEND_DOWN)
  }

  if (!res.ok) {
    let message = 'Something went wrong, try again'
    try {
      const data = await res.json()
      if (typeof data.detail === 'string') {
        message = data.detail
      }
    } catch {
      message = BACKEND_DOWN
    }
    throw new Error(message)
  }

  return res.json()
}

export function getModes() {
  return request('/api/modes')
}

export function startSession(session) {
  const form = new FormData()
  form.append('mode', session.mode)
  form.append('option', session.option)

  return request('/api/start', { method: 'POST', body: form })
}

export function sendTurn(audioBlob, history, session) {
  const form = new FormData()
  form.append('audio', audioBlob, 'recording.webm')
  form.append('history', JSON.stringify(history))
  form.append('mode', session.mode)
  form.append('option', session.option)

  return request('/api/turn', { method: 'POST', body: form })
}
