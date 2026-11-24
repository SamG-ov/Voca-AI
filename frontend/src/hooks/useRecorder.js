import { useCallback, useEffect, useRef, useState } from 'react'

// Asks for the microphone once, then records short clips with start() and stop()
function useRecorder() {
  const [micError, setMicError] = useState(false)
  const streamRef = useRef(null)
  const recorderRef = useRef(null)
  const chunksRef = useRef([])
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)

  useEffect(() => {
    let stopped = false

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        if (stopped) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }
        streamRef.current = stream

        // the analyser lets us measure how loud the mic is, for the orb
        const audioContext = new AudioContext()
        const analyser = audioContext.createAnalyser()
        audioContext.createMediaStreamSource(stream).connect(analyser)
        audioContextRef.current = audioContext
        analyserRef.current = analyser
      })
      .catch(() => setMicError(true))

    // turn the microphone off when we leave the page
    return () => {
      stopped = true
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  function start() {
    if (!streamRef.current) {
      return false
    }

    audioContextRef.current.resume()
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

  // returns a number from 0 (silent) to about 0.5 (very loud)
  // useCallback keeps it the same function between renders
  const getVolume = useCallback(() => {
    const analyser = analyserRef.current
    if (!analyser) {
      return 0
    }

    const samples = new Uint8Array(analyser.fftSize)
    analyser.getByteTimeDomainData(samples)

    let sum = 0
    for (const sample of samples) {
      const value = (sample - 128) / 128
      sum += value * value
    }
    return Math.sqrt(sum / samples.length)
  }, [])

  return { start, stop, getVolume, micError }
}

export default useRecorder
