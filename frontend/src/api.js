const BACKEND_DOWN = 'Could not reach the backend. Is it running?'

// Android records webm, iPhones record mp4
function audioFileName(audioBlob) {
  if (audioBlob.type.includes('mp4')) {
    return 'recording.mp4'
  }
  return 'recording.webm'
}

// The app password is saved in the browser after logging in once
export function savePassword(password) {
  localStorage.setItem('voca-password', password)
}

// Sends a request and turns any problem into an Error with a readable message
async function request(url, options = {}) {
  const headers = { ...options.headers, 'X-App-Password': localStorage.getItem('voca-password') || '' }

  let res
  try {
    res = await fetch(url, { ...options, headers: headers })
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

// returns true if the saved password is right (or if the app has no password)
export async function checkPassword() {
  const res = await fetch('/api/login', { headers: { 'X-App-Password': localStorage.getItem('voca-password') || '' } })
  return res.ok
}

export function getModes() {
  return request('/api/modes')
}

export function startSession(session) {
  const form = new FormData()
  form.append('mode', session.mode)
  form.append('option', session.option)
  form.append('voice', session.voice)
  form.append('speed', session.speed)

  return request('/api/start', { method: 'POST', body: form })
}

export function getDrillSentence(currentSentence, session) {
  const form = new FormData()
  form.append('current', currentSentence)
  form.append('voice', session.voice)
  form.append('speed', session.speed)

  return request('/api/drill/next', { method: 'POST', body: form })
}

export function checkDrill(audioBlob, sentence) {
  const form = new FormData()
  form.append('audio', audioBlob, audioFileName(audioBlob))
  form.append('sentence', sentence)

  return request('/api/drill/check', { method: 'POST', body: form })
}

export function getReview(messages, corrections) {
  return request('/api/review', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: messages, corrections: corrections }),
  })
}

export function sendTurn(audioBlob, history, session) {
  const form = new FormData()
  form.append('audio', audioBlob, audioFileName(audioBlob))
  form.append('history', JSON.stringify(history))
  form.append('mode', session.mode)
  form.append('option', session.option)
  form.append('voice', session.voice)
  form.append('speed', session.speed)

  return request('/api/turn', { method: 'POST', body: form })
}
