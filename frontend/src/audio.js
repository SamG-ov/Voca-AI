// Plays the base64 mp3 that the backend sends, and calls onEnded when it's done
export function playAudio(base64Audio, onEnded) {
  const player = new Audio('data:audio/mpeg;base64,' + base64Audio)
  player.onended = onEnded
  player.play().catch(onEnded)
  return player
}
