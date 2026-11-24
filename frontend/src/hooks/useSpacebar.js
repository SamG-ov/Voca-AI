import { useEffect } from 'react'

// Calls onPress when space goes down and onRelease when it comes back up
function useSpacebar(onPress, onRelease) {
  useEffect(() => {
    function isTyping(event) {
      const tag = event.target.tagName
      return tag === 'INPUT' || tag === 'TEXTAREA'
    }

    function handleKeyDown(event) {
      if (event.code !== 'Space' || isTyping(event)) return
      event.preventDefault() // stop the page from scrolling

      // holding a key fires keydown again and again, we only want the first one
      if (event.repeat) return
      onPress()
    }

    function handleKeyUp(event) {
      if (event.code !== 'Space' || isTyping(event)) return
      event.preventDefault() // stop space from clicking a focused button
      onRelease()
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [onPress, onRelease])
}

export default useSpacebar
