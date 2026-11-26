// One audio player for the whole app.
// iPhones only let a page play sound if the player was first started by a tap,
// so we "unlock" this player on the first tap and then reuse it for every reply.
const player = new Audio()

// a tiny silent sound, used only to unlock the player
const SILENCE =
  'data:audio/wav;base64,UklGRnQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YVAAAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgA=='

let unlocked = false

// call this inside a click or tap handler
export function unlockAudio() {
  if (unlocked) return
  unlocked = true
  player.src = SILENCE
  player.play().catch(() => {})
}

// Plays the base64 mp3 that the backend sends, and calls onEnded when it's done
export function playAudio(base64Audio, onEnded) {
  player.onended = onEnded
  player.src = 'data:audio/mpeg;base64,' + base64Audio
  player.play().catch(onEnded)
}

export function stopAudio() {
  player.onended = null
  player.pause()
}
