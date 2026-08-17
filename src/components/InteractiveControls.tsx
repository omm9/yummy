import { formatDuration, recipeTotalSeconds } from '../lib/time'
import { useSelectedRecipe } from '../store/recipeStore'
import { useSessionStore } from '../store/sessionStore'

export function InteractiveControls() {
  const recipe = useSelectedRecipe()
  const phase = useSessionStore((s) => s.phase)
  const displayElapsedMs = useSessionStore((s) => s.displayElapsedMs)
  const voiceNotice = useSessionStore((s) => s.voiceNotice)
  const start = useSessionStore((s) => s.start)
  const pause = useSessionStore((s) => s.pause)
  const resume = useSessionStore((s) => s.resume)
  const stop = useSessionStore((s) => s.stop)
  const skip = useSessionStore((s) => s.skip)

  const total = recipe ? recipeTotalSeconds(recipe.steps) : 0
  const elapsedSec = Math.floor(displayElapsedMs / 1000)
  const canStart = Boolean(recipe && recipe.steps.length > 0)

  const btn =
    'inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40'

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {phase === 'idle' ? (
          <button
            type="button"
            disabled={!canStart}
            onClick={() => {
              if (!start()) return
              if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                window.speechSynthesis.resume()
              }
            }}
            className={`${btn} bg-olive-600 text-white hover:bg-olive-500`}
            title="Begin cooking from 0:00. Steps lock, timers and voice start."
          >
            Start
          </button>
        ) : null}

        {phase === 'running' ? (
          <button
            type="button"
            onClick={pause}
            className={`${btn} bg-ink-900 text-white hover:bg-ink-800`}
            title="Freeze the whole cook — clock, countdowns, and voice. Use if you need to step away."
          >
            Pause
          </button>
        ) : null}

        {phase === 'paused' ? (
          <button
            type="button"
            onClick={resume}
            className={`${btn} bg-olive-600 text-white hover:bg-olive-500`}
            title="Resume from where you paused."
          >
            Continue
          </button>
        ) : null}

        {phase !== 'idle' ? (
          <button
            type="button"
            onClick={() => skip()}
            className={`${btn} border border-ink-200 bg-white text-ink-800 hover:bg-ink-50`}
            title="Mark this step done and go to the next. Use if you already finished it."
          >
            Skip
          </button>
        ) : null}

        {phase !== 'idle' ? (
          <button
            type="button"
            onClick={stop}
            className={`${btn} border border-ink-200 bg-white text-ink-800 hover:bg-ink-50`}
            title="End the session and discard progress. Editing unlocks."
          >
            Stop
          </button>
        ) : null}

        {phase !== 'idle' ? (
          <span className="font-mono text-sm tabular-nums text-ink-700">
            {formatDuration(elapsedSec)}
            <span className="text-ink-400"> / {formatDuration(total)}</span>
            {phase === 'paused' ? (
              <span className="ml-2 text-xs font-sans font-semibold uppercase tracking-wide text-amber-700">
                Paused
              </span>
            ) : null}
          </span>
        ) : null}
      </div>
      {voiceNotice ? (
        <p className="text-xs text-ink-500">{voiceNotice}</p>
      ) : null}
    </div>
  )
}
