import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { RecipeStep } from '../types/recipe'
import { startsBeforePrevious } from '../lib/time'
import { ActivityCell } from './ActivityCell'
import { FlameCell } from './FlameCell'
import { StepTimelineBar } from './StepTimelineBar'
import { TimeField } from './TimeField'

interface TimelineRowProps {
  step: RecipeStep
  index: number
  previousStartSeconds?: number
  recipeTotalSeconds: number
  locked: boolean
  onUpdate: (patch: Partial<Omit<RecipeStep, 'id'>>) => void
  onDelete: () => void
}

export function TimelineRow({
  step,
  index,
  previousStartSeconds,
  recipeTotalSeconds,
  locked,
  onUpdate,
  onDelete,
}: TimelineRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: step.id, disabled: locked })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const orderWarn = startsBeforePrevious(step.startSeconds, previousStartSeconds)

  const rowTone = `${
    isDragging ? 'relative z-10 opacity-90 shadow-soft' : 'hover:bg-ink-50/80'
  } ${locked ? 'opacity-90' : ''} ${orderWarn ? 'bg-amber-50/70' : 'bg-white/80'}`

  return (
    <tbody
      ref={setNodeRef}
      style={style}
      className={`group border-b border-ink-100 transition ${rowTone}`}
    >
      {/* 1) Timeline bar */}
      <tr>
        <td className="w-10 px-2 pt-3 align-top" rowSpan={3}>
          <button
            type="button"
            className={`flex h-8 w-8 items-center justify-center rounded-md text-ink-400 ${
              locked
                ? 'cursor-not-allowed opacity-40'
                : 'cursor-grab hover:bg-ink-100 hover:text-ink-700 active:cursor-grabbing'
            }`}
            aria-label={`Drag to reorder step ${index + 1}`}
            disabled={locked}
            {...attributes}
            {...listeners}
          >
            <span aria-hidden className="select-none text-base leading-none">
              ⋮⋮
            </span>
          </button>
        </td>

        <td colSpan={4} className="px-2 pt-3 pb-1 align-top">
          <StepTimelineBar
            startSeconds={step.startSeconds}
            durationSeconds={step.durationSeconds}
            recipeTotalSeconds={recipeTotalSeconds}
          />
        </td>

        <td className="px-2 py-3 align-top" rowSpan={3}>
          {locked ? (
            <div className="max-h-36 overflow-y-auto whitespace-pre-wrap break-words text-sm leading-relaxed text-ink-900">
              {step.ingredients || (
                <span className="text-ink-400 italic">No ingredients</span>
              )}
              {step.optional ? (
                <span className="ml-2 rounded bg-ink-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-500">
                  Optional
                </span>
              ) : null}
            </div>
          ) : (
            <textarea
              value={step.ingredients}
              onChange={(e) => onUpdate({ ingredients: e.target.value })}
              rows={Math.max(3, Math.min(6, step.ingredients.split('\n').length))}
              className="w-full max-w-full resize-y rounded-md border border-ink-200 bg-white px-2.5 py-2 text-sm leading-relaxed text-ink-900 shadow-sm transition hover:border-ink-400 focus:border-olive-500 focus:outline-none focus:ring-2 focus:ring-olive-500/30"
              placeholder={'One ingredient per line\ne.g. 2 tomatoes 🍅'}
              aria-label={`Ingredients for step ${index + 1}`}
            />
          )}
        </td>

        <td className="px-2 py-3 align-top" rowSpan={3}>
          {locked ? (
            <span className="block break-words text-sm text-ink-700">
              {step.alternatives || <span className="text-ink-300">—</span>}
            </span>
          ) : (
            <input
              type="text"
              value={step.alternatives}
              onChange={(e) => onUpdate({ alternatives: e.target.value })}
              className="w-full max-w-full rounded-md border border-ink-200 bg-white px-2.5 py-1.5 text-sm text-ink-900 shadow-sm transition hover:border-ink-400 focus:border-olive-500 focus:outline-none focus:ring-2 focus:ring-olive-500/30"
              placeholder="Alternatives (optional)"
              aria-label={`Alternatives for step ${index + 1}`}
            />
          )}
        </td>

        <td className="w-12 px-2 py-3 align-top" rowSpan={3}>
          <button
            type="button"
            onClick={onDelete}
            disabled={locked}
            className={`flex h-8 w-8 items-center justify-center rounded-md text-base transition ${
              locked
                ? 'cursor-not-allowed opacity-30'
                : 'text-ink-400 hover:bg-red-50 hover:text-red-600'
            }`}
            aria-label={`Delete step ${index + 1}`}
            title="Delete step"
          >
            🗑️
          </button>
        </td>
      </tr>

      {/* 2) Step | Flame | Time | Duration */}
      <tr>
        <td className="px-2 pt-2 align-top">
          <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-ink-100 px-2 font-mono text-sm font-medium text-ink-800">
            {index + 1}
          </span>
        </td>

        <td className="px-2 pt-2 align-top">
          <FlameCell
            value={step.flame}
            locked={locked}
            onChange={(flame) => onUpdate({ flame })}
          />
        </td>

        <td className="px-2 pt-2 align-top">
          <div className="space-y-1">
            <TimeField
              seconds={step.startSeconds}
              locked={locked}
              onChange={(startSeconds) => onUpdate({ startSeconds })}
              ariaLabel={`Start time for step ${index + 1}`}
              warn={orderWarn}
              title={
                orderWarn
                  ? 'Start time is before the previous step — next steps should start at the same time or later'
                  : 'Start time from recipe begin (0:00)'
              }
            />
            {orderWarn ? (
              <p className="text-[10px] leading-snug text-amber-700">
                Starts before previous step
              </p>
            ) : null}
          </div>
        </td>

        <td className="px-2 pt-2 align-top">
          <TimeField
            seconds={step.durationSeconds}
            locked={locked}
            onChange={(durationSeconds) => onUpdate({ durationSeconds })}
            ariaLabel={`Duration for step ${index + 1}`}
          />
        </td>
      </tr>

      {/* 3) Group + Activity spanning Step → Duration */}
      <tr>
        <td colSpan={4} className="px-2 pb-3 pt-1 align-top">
          <ActivityCell
            value={step.activityId}
            locked={locked}
            onChange={(activityId) => onUpdate({ activityId })}
          />
        </td>
      </tr>
    </tbody>
  )
}
