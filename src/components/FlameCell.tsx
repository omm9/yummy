import type { FlameLevel } from '../types/recipe'

const FLAME_OPTIONS: { value: FlameLevel; label: string; emoji: string }[] = [
  { value: 'high', label: 'High', emoji: '🔴' },
  { value: 'medium', label: 'Medium', emoji: '🟡' },
  { value: 'low', label: 'Low', emoji: '🔵' },
  { value: null, label: 'No heat', emoji: '📴' },
]

interface FlameCellProps {
  value: FlameLevel
  locked: boolean
  onChange: (flame: FlameLevel) => void
}

export function FlameCell({ value, locked, onChange }: FlameCellProps) {
  const current = FLAME_OPTIONS.find((o) => o.value === value) ?? FLAME_OPTIONS[3]

  if (locked) {
    return (
      <span
        className="inline-flex h-9 w-9 items-center justify-center text-lg"
        title={value ? `${current.label} heat` : 'No vessel heat'}
        aria-label={value ? `${current.label} heat` : 'No vessel heat'}
      >
        {current.emoji}
      </span>
    )
  }

  return (
    <label className="relative inline-flex">
      <span className="sr-only">Flame level</span>
      <select
        value={value ?? ''}
        onChange={(e) => {
          const v = e.target.value
          onChange(v === '' ? null : (v as Exclude<FlameLevel, null>))
        }}
        className="h-9 w-11 cursor-pointer appearance-none rounded-md border border-ink-200 bg-white text-transparent shadow-sm transition hover:border-ink-400 focus:border-olive-500 focus:outline-none focus:ring-2 focus:ring-olive-500/30"
        title={value ? `${current.label} heat` : 'No vessel heat'}
        aria-label="Flame level"
      >
        {FLAME_OPTIONS.map((opt) => (
          <option key={String(opt.value)} value={opt.value ?? ''}>
            {opt.emoji} {opt.label}
          </option>
        ))}
      </select>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-center text-lg"
      >
        {current.emoji}
      </span>
    </label>
  )
}
