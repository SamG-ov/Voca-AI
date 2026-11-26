const VOICES = [
  { id: 'denise', name: 'Denise (female)' },
  { id: 'henri', name: 'Henri (male)' },
  { id: 'vivienne', name: 'Vivienne (female, better English, can be slow)' },
  { id: 'remy', name: 'Remy (male, better English, can be slow)' },
]

const SPEEDS = [
  { value: '-25%', name: 'Slow' },
  { value: '-10%', name: 'A bit slower' },
  { value: '+0%', name: 'Normal' },
]

function Settings({ settings, onChange }) {
  return (
    <div className="flex w-full max-w-4xl flex-wrap items-center justify-center gap-6 border-t border-slate-800 pt-6 text-sm text-slate-400">
      <label className="flex items-center gap-2">
        Tutor voice
        <select
          value={settings.voice}
          onChange={(event) => onChange({ ...settings, voice: event.target.value })}
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-200"
        >
          {VOICES.map((voice) => (
            <option key={voice.id} value={voice.id}>
              {voice.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2">
        Speaking speed
        <select
          value={settings.speed}
          onChange={(event) => onChange({ ...settings, speed: event.target.value })}
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-200"
        >
          {SPEEDS.map((speed) => (
            <option key={speed.value} value={speed.value}>
              {speed.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}

export default Settings
