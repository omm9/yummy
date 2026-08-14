import { useEffect, useState } from 'react'
import { formatDuration, parseDuration } from '../lib/time'

interface TimeFieldProps {
  seconds: number
  locked: boolean
  onChange: (seconds: number) => void
  ariaLabel: string
  warn?: boolean
  title?: string
}

/** Editable MM:SS / HH:MM:SS field used for duration and start time. */
export function TimeField({
  seconds,
  locked,
  onChange,
  ariaLabel,
  warn = false,
  title,
}: TimeFieldProps) {
  const [text, setText] = useState(formatDuration(seconds))

  useEffect(() => {
    setText(formatDuration(seconds))
  }, [seconds])

  if (locked) {
    return (
      <span
        className={`font-mono text-sm tabular-nums ${
          warn ? 'text-amber-700' : 'text-ink-800'
        }`}
        title={title}
      >
        {formatDuration(seconds)}
      </span>
    )
  }

  return (
    <input
      type="text"
      value={text}
      title={title}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => {
        const parsed = parseDuration(text)
        if (parsed === null) {
          setText(formatDuration(seconds))
          return
        }
        onChange(parsed)
        setText(formatDuration(parsed))
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          ;(e.target as HTMLInputElement).blur()
        }
      }}
      className={`w-[5.5rem] rounded-md border bg-white px-2 py-1.5 font-mono text-sm tabular-nums text-ink-900 shadow-sm transition focus:outline-none focus:ring-2 ${
        warn
          ? 'border-amber-400 focus:border-amber-500 focus:ring-amber-500/30'
          : 'border-ink-200 hover:border-ink-400 focus:border-olive-500 focus:ring-olive-500/30'
      }`}
      aria-label={ariaLabel}
      aria-invalid={warn || undefined}
      inputMode="numeric"
      placeholder="MM:SS"
    />
  )
}
