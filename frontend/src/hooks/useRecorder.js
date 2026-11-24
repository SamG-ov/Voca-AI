import { useEffect, useRef, useState } from 'react'

// Asks for the microphone once, then records short clips with start() and stop()
function useRecorder() {
  const [micError, setMicError] = useState(false)
  const streamRef = useRef(null)
  const recorderRef = useRef(null)
  const chunksRef = useRef([])

  useEffect(() => {
    let stopped = false

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        if (stopped) {
          stream.getTracks().forEach((track) => track.stop())
        } else {
          streamRef.current = stream
        }
      })
      .catch(() => setMicError(true))

    // turn the microphone off when we leave the page
    return () => {
      stopped = true
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  function start() {
    if (!streamRef.current) {
      return false
    }

    chunksRef.current = []
    const recorder = new MediaRecorder(streamRef.current)
    recorder.ondataavailable = (event) => chunksRef.current.push(event.data)
    recorder.start()
    recorderRef.current = recorder
    return true
  }

  function stop() {
    return new Promise((resolve) => {
      const recorder = recorderRef.current
      recorder.onstop = () => {
        resolve(new Blob(chunksRef.current, { type: recorder.mimeType }))
      }
      recorder.stop()
    })
  }

  return { start, stop, micError }
}

export default useRecorder
