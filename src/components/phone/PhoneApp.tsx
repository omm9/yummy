import { getActivityMeta } from '../../data/activities'
import { getNowStep } from '../../lib/liveStep'
import { formatDuration, recipeTotalSeconds } from '../../lib/time'
import {
  displayRecipeTitle,
  useRecipeStore,
  useSelectedRecipe,
} from '../../store/recipeStore'
import { useSessionStore } from '../../store/sessionStore'

const FLAME_LABEL: Record<'high' | 'medium' | 'low', string> = {
  high: 'High heat',
  medium: 'Medium heat',
  low: 'Low heat',
}

export function PhoneApp() {
  const phase = useSessionStore((s) => s.phase)
  const completing = useSessionStore((s) => s.completing)

  if (phase !== 'idle') {
    return <PhoneCook completing={completing} />
  }
  return <PhoneList />
}

function PhoneList() {
  const recipes = useRecipeStore((s) => s.recipes)
  const selectedId = useRecipeStore((s) => s.selectedId)
  const selectRecipe = useRecipeStore((s) => s.selectRecipe)
  const recipe = useSelectedRecipe()
  const start = useSessionStore((s) => s.start)
  const canStart = Boolean(recipe && recipe.steps.length > 0)

  return (
    <div className="flex h-full flex-col bg-[#f3f5f2]">
      <header className="px-5 pb-3 pt-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-olive-600">
          Recipes
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-ink-950">
          Your kitchen
        </h1>
      </header>
      <ul className="min-h-0 flex-1 overflow-y-auto px-3 pb-3" role="listbox">
        {recipes.map((item) => {
          const selected = item.id === selectedId
          return (
            <li key={item.id} className="mb-1.5">
              <button
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => selectRecipe(item.id)}
                className={`w-full rounded-2xl border px-4 py-3 text-left ${
                  selected
                    ? 'border-olive-500/40 bg-olive-500/15'
                    : 'border-transparent bg-white/80'
                }`}
              >
                <span className="block truncate font-medium text-ink-900">
                  {displayRecipeTitle(item.title)}
                </span>
                <span className="mt-0.5 block font-mono text-xs tabular-nums text-ink-500">
                  {item.steps.length} step{item.steps.length === 1 ? '' : 's'} ·{' '}
                  {formatDuration(recipeTotalSeconds(item.steps))}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      <div className="border-t border-ink-200/80 bg-white/90 px-4 py-4">
        <button
          type="button"
          disabled={!canStart}
          onClick={() => {
            if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
              window.speechSynthesis.resume()
            }
            start()
          }}
          className="w-full rounded-2xl bg-olive-600 py-3.5 text-base font-semibold text-white disabled:cursor-not-allowed disabled:bg-ink-200 disabled:text-ink-400"
        >
          Start
        </button>
      </div>
    </div>
  )
}

function PhoneCook({ completing }: { completing: boolean }) {
  const recipe = useSelectedRecipe()
  const phase = useSessionStore((s) => s.phase)
  const displayElapsedMs = useSessionStore((s) => s.displayElapsedMs)
  const stepRuntime = useSessionStore((s) => s.stepRuntime)
  const speakingStepId = useSessionStore((s) => s.speakingStepId)
  const pause = useSessionStore((s) => s.pause)
  const resume = useSessionStore((s) => s.resume)
  const skip = useSessionStore((s) => s.skip)
  const stop = useSessionStore((s) => s.stop)

  if (!recipe) return null

  const now = getNowStep(recipe, stepRuntime, speakingStepId)
  const elapsedSec = Math.floor(displayElapsedMs / 1000)
  const total = recipeTotalSeconds(recipe.steps)
  const meta = now ? getActivityMeta(now.step.activityId) : null
  const rt = now ? stepRuntime[now.step.id] : undefined

  const remainingLabel = completing
    ? '00:00'
    : rt?.completed
      ? '00:00'
      : rt?.countdownStarted
        ? formatDuration(rt.remainingSeconds)
        : rt?.announced
          ? '…'
          : '—'

  const ingredientLines = now
    ? now.step.ingredients
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
    : []

  return (
    <div className="flex h-full flex-col bg-[#f3f5f2]">
      <header className="px-5 pb-2 pt-4">
        <h1 className="truncate font-display text-xl font-semibold tracking-tight text-ink-950">
          {displayRecipeTitle(recipe.title)}
        </h1>
        <p className="mt-1 font-mono text-sm tabular-nums text-ink-600">
          {formatDuration(elapsedSec)}
          <span className="text-ink-400"> / {formatDuration(total)}</span>
          {phase === 'paused' ? (
            <span className="ml-2 font-sans text-xs font-semibold uppercase tracking-wide text-amber-700">
              Paused
            </span>
          ) : null}
        </p>
      </header>

      <div className="flex gap-2 px-4 pb-3">
        {phase === 'running' ? (
          <button
            type="button"
            onClick={pause}
            className="flex-1 rounded-xl bg-ink-900 py-2.5 text-sm font-semibold text-white"
          >
            Pause
          </button>
        ) : (
          <button
            type="button"
            onClick={resume}
            className="flex-1 rounded-xl bg-olive-600 py-2.5 text-sm font-semibold text-white"
          >
            Continue
          </button>
        )}
        <button
          type="button"
          onClick={() => skip()}
          className="flex-1 rounded-xl border border-ink-200 bg-white py-2.5 text-sm font-semibold text-ink-800"
        >
          Skip
        </button>
        <button
          type="button"
          onClick={stop}
          className="flex-1 rounded-xl border border-ink-200 bg-white py-2.5 text-sm font-semibold text-ink-800"
        >
          Stop
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-4 pb-6">
        <div className="flex min-h-0 flex-1 flex-col rounded-[28px] border-l-4 border-olive-600 bg-olive-500/20 px-5 py-6">
          {completing || !now ? (
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <p className="font-display text-2xl font-semibold text-ink-950">
                Cooking complete
              </p>
              <p className="mt-2 text-ink-600">Enjoy your meal.</p>
            </div>
          ) : (
            <>
              <p className="text-sm font-semibold text-olive-800">
                Step {now.index + 1}
                {meta ? ` · ${meta.activity.label}` : ''}
              </p>
              {now.step.flame ? (
                <p className="mt-1 text-sm text-ink-700">{FLAME_LABEL[now.step.flame]}</p>
              ) : (
                <p className="mt-1 text-sm text-ink-500">No heat</p>
              )}
              <p className="mt-8 text-center font-mono text-6xl font-semibold tabular-nums tracking-tight text-olive-800">
                {remainingLabel}
              </p>
              <div className="mt-8 min-h-0 flex-1 overflow-y-auto">
                {ingredientLines.length > 0 ? (
                  <ul className="space-y-1.5 text-center text-base text-ink-800">
                    {ingredientLines.map((line, i) => (
                      <li key={`${i}-${line}`}>{line}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-center text-sm italic text-ink-400">No ingredients</p>
                )}
                {now.step.comment?.trim() ? (
                  <p className="mt-4 whitespace-pre-wrap text-center text-sm leading-relaxed text-ink-600">
                    {now.step.comment.trim()}
                  </p>
                ) : null}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
