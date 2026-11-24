import { useEffect, useState } from 'react'
import { motion } from 'motion/react'

// How the orb moves in each state
const ANIMATIONS = {
  idle: {
    scale: [1, 1.04, 1],
    opacity: 0.7,
    transition: { duration: 4, repeat: Infinity },
  },
  thinking: {
    scale: [1, 0.9, 1],
    opacity: [0.9, 0.5, 0.9],
    transition: { duration: 1.2, repeat: Infinity },
  },
  speaking: {
    scale: [1, 1.12, 1.02, 1.1, 1],
    opacity: 1,
    transition: { duration: 1.4, repeat: Infinity },
  },
}

function Orb({ status, getVolume, size = 'h-40 w-40' }) {
  const [volume, setVolume] = useState(0)

  // while listening, check the mic volume on every frame
  useEffect(() => {
    if (status !== 'listening') return

    let frame
    function update() {
      setVolume(getVolume())
      frame = requestAnimationFrame(update)
    }
    update()

    return () => cancelAnimationFrame(frame)
  }, [status, getVolume])

  let animation = ANIMATIONS[status]
  if (status === 'listening') {
    // louder voice = bigger orb
    animation = {
      scale: 1 + Math.min(volume * 3, 0.5),
      opacity: 1,
      transition: { duration: 0.1 },
    }
  }

  return (
    <div className={`relative ${size}`}>
      {/* soft glow behind the orb */}
      <motion.div
        className="absolute inset-0 rounded-full bg-cyan-400 blur-2xl"
        animate={{ opacity: status === 'idle' ? 0.15 : 0.4 }}
      />
      <motion.div
        className="absolute inset-0 rounded-full bg-radial from-cyan-200 via-cyan-400 to-cyan-900"
        animate={animation}
      />
    </div>
  )
}

export default Orb
