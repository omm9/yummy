/** Format seconds as MM:SS or HH:MM:SS when hours are needed. */
export function formatDuration(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds))
  const hours = Math.floor(safe / 3600)
  const minutes = Math.floor((safe % 3600) / 60)
  const seconds = safe % 60

  const mm = String(minutes).padStart(2, '0')
  const ss = String(seconds).padStart(2, '0')

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${mm}:${ss}`
  }
  return `${mm}:${ss}`
}

/** Parse MM:SS or HH:MM:SS into seconds. Returns null if invalid. */
export function parseDuration(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return 0

  const parts = trimmed.split(':').map((p) => p.trim())
  if (parts.length < 2 || parts.length > 3) return null
  if (parts.some((p) => p === '' || !/^\d+$/.test(p))) return null

  const nums = parts.map(Number)
  if (nums.some((n) => Number.isNaN(n))) return null

  if (nums.length === 2) {
    const [m, s] = nums
    if (s >= 60) return null
    return m * 60 + s
  }

  const [h, m, s] = nums
  if (m >= 60 || s >= 60) return null
  return h * 3600 + m * 60 + s
}

export interface TimedStep {
  startSeconds: number
  durationSeconds: number
}

/** End time of a step (start + duration). */
export function stepEndSeconds(step: TimedStep): number {
  return Math.max(0, step.startSeconds) + Math.max(0, step.durationSeconds)
}

/** Recipe wall-clock total = latest step end (supports parallel steps). */
export function recipeTotalSeconds(steps: TimedStep[]): number {
  if (steps.length === 0) return 0
  return Math.max(...steps.map(stepEndSeconds))
}

/**
 * Default start for a newly appended step:
 * the latest end among existing steps (covers parallel work).
 */
export function defaultNextStartSeconds(steps: TimedStep[]): number {
  return recipeTotalSeconds(steps)
}

/** True when this step starts before the previous step's start. */
export function startsBeforePrevious(
  startSeconds: number,
  previousStartSeconds: number | undefined,
): boolean {
  if (previousStartSeconds === undefined) return false
  return startSeconds < previousStartSeconds
}

/**
 * Fill missing startSeconds with sequential starts
 * (each step begins when the previous one would have ended).
 */
export function ensureStepStarts<T extends { durationSeconds: number; startSeconds?: number }>(
  steps: T[],
): (T & { startSeconds: number })[] {
  let sequential = 0
  return steps.map((step) => {
    if (typeof step.startSeconds === 'number') {
      sequential = stepEndSeconds({
        startSeconds: step.startSeconds,
        durationSeconds: step.durationSeconds,
      })
      return { ...step, startSeconds: step.startSeconds }
    }
    const startSeconds = sequential
    sequential += Math.max(0, step.durationSeconds)
    return { ...step, startSeconds }
  })
}
