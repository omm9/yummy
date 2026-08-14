import { formatDuration, stepEndSeconds } from '../lib/time'

interface StepTimelineBarProps {
  startSeconds: number
  durationSeconds: number
  recipeTotalSeconds: number
}

/** Horizontal bar: full recipe span with this step's window highlighted. */
export function StepTimelineBar({
  startSeconds,
  durationSeconds,
  recipeTotalSeconds,
}: StepTimelineBarProps) {
  const total = Math.max(recipeTotalSeconds, 1)
  const start = Math.max(0, startSeconds)
  const end = Math.max(start, stepEndSeconds({ startSeconds, durationSeconds }))
  const leftPct = Math.min(100, (start / total) * 100)
  const widthPct = Math.min(100 - leftPct, ((end - start) / total) * 100)

  return (
    <div className="w-full">
      <div
        className="relative h-3.5 overflow-hidden rounded-full bg-ink-100"
        title={`${formatDuration(start)} → ${formatDuration(end)} (${formatDuration(durationSeconds)})`}
        role="img"
        aria-label={`Runs from ${formatDuration(start)} to ${formatDuration(end)} on a ${formatDuration(total)} timeline`}
      >
        <div
          className="absolute inset-y-0 rounded-full bg-olive-500/80"
          style={{ left: `${leftPct}%`, width: `${Math.max(widthPct, 0.6)}%` }}
        />
      </div>
      <div className="mt-1 flex justify-between font-mono text-[10px] tabular-nums text-ink-400">
        <span>0:00</span>
        <span>
          {formatDuration(start)}–{formatDuration(end)}
        </span>
        <span>{formatDuration(total)}</span>
      </div>
    </div>
  )
}
