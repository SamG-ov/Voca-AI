import { motion } from 'motion/react'

function CorrectionCard({ correction }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      className="rounded-xl border border-slate-800 bg-slate-900 p-4"
    >
      <p className="text-rose-300 line-through">{correction.original}</p>
      <p className="font-medium text-emerald-300">{correction.corrected}</p>
      <p className="mt-2 text-sm text-slate-400">{correction.explanation}</p>
    </motion.div>
  )
}

export default CorrectionCard
