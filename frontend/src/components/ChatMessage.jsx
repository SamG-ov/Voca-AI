import { motion } from 'motion/react'

function ChatMessage({ message }) {
  const isUser = message.role === 'user'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
    >
      <div
        className={
          isUser
            ? 'max-w-md rounded-2xl rounded-br-sm bg-slate-800 px-4 py-2'
            : 'max-w-md rounded-2xl rounded-bl-sm border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-cyan-50'
        }
      >
        {message.text}
      </div>

      {isUser && message.corrections.length > 0 && (
        <p className="mt-1 text-xs text-amber-300">
          {message.corrections.length} {message.corrections.length === 1 ? 'correction' : 'corrections'}
        </p>
      )}

      {!isUser && message.newVocab.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-2">
          {message.newVocab.map((word, index) => (
            <span key={index} className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
              {word.word} = {word.translation}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  )
}

export default ChatMessage
