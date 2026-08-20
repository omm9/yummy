import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { toast, Toaster } from 'sonner'
import { CUISINES, cuisineHeading, normalizeCuisine } from '../data/cuisines'
import { formatDuration, recipeTotalSeconds } from '../lib/time'
import {
  displayRecipeTitle,
  useRecipeStore,
  useSelectedRecipe,
} from '../store/recipeStore'
import { useSessionStore } from '../store/sessionStore'
import { IngredientsSummary } from './IngredientsSummary'
import { InteractiveControls } from './InteractiveControls'
import { TimelineRow } from './TimelineRow'

export function RecipeTimeline() {
  const recipe = useSelectedRecipe()
  const interactiveMode = useRecipeStore((s) => s.interactiveMode)
  const setTitle = useRecipeStore((s) => s.setTitle)
  const setCuisine = useRecipeStore((s) => s.setCuisine)
  const addStep = useRecipeStore((s) => s.addStep)
  const deleteStep = useRecipeStore((s) => s.deleteStep)
  const undoDeleteStep = useRecipeStore((s) => s.undoDeleteStep)
  const clearLastDeletedStep = useRecipeStore((s) => s.clearLastDeletedStep)
  const reorderSteps = useRecipeStore((s) => s.reorderSteps)
  const updateStep = useRecipeStore((s) => s.updateStep)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const sessionPhase = useSessionStore((s) => s.phase)
  const stepRuntime = useSessionStore((s) => s.stepRuntime)
  const sessionActive = sessionPhase !== 'idle'

  if (!recipe) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-16 text-center">
        <div className="max-w-sm space-y-2">
          <h1 className="font-display text-2xl font-semibold text-ink-950">
            No recipe selected
          </h1>
          <p className="text-sm text-ink-500">
            Pick a recipe from the list, or create a new one to start building a
            timeline.
          </p>
        </div>
      </div>
    )
  }

  const steps = recipe.steps
  const totalSeconds = recipeTotalSeconds(steps)

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    reorderSteps(String(active.id), String(over.id))
  }

  const handleDelete = (id: string) => {
    deleteStep(id)
    toast('Step deleted', {
      action: {
        label: 'Undo',
        onClick: () => undoDeleteStep(),
      },
      onDismiss: () => clearLastDeletedStep(),
      onAutoClose: () => clearLastDeletedStep(),
    })
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-olive-600">
            Timeline
          </p>
          {interactiveMode ? (
            <h1 className="font-display text-3xl font-semibold tracking-tight text-ink-950 sm:text-4xl">
              {displayRecipeTitle(recipe.title)}
            </h1>
          ) : (
            <input
              value={recipe.title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Untitled"
              className="w-full max-w-xl border-0 border-b border-transparent bg-transparent font-display text-3xl font-semibold tracking-tight text-ink-950 outline-none transition placeholder:text-ink-300 hover:border-ink-200 focus:border-olive-500 sm:text-4xl"
              aria-label="Recipe title"
            />
          )}
          {interactiveMode ? (
            <p className="text-sm text-ink-500">{cuisineHeading(normalizeCuisine(recipe.cuisine))}</p>
          ) : (
            <label className="flex items-center gap-2 text-sm text-ink-600">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-400">
                Cuisine
              </span>
              <select
                value={normalizeCuisine(recipe.cuisine)}
                onChange={(e) => setCuisine(normalizeCuisine(e.target.value))}
                className="rounded-md border border-ink-200 bg-white px-2 py-1 text-sm text-ink-800 outline-none focus:border-olive-500 focus:ring-2 focus:ring-olive-500/30"
                aria-label="Cuisine"
              >
                {CUISINES.map((cuisine) => (
                  <option key={cuisine.id} value={cuisine.id}>
                    {cuisine.icon} {cuisine.label}
                  </option>
                ))}
                <option value="uncategorized">🥘 Yours</option>
              </select>
            </label>
          )}
          <p className="text-sm text-ink-500">
            {steps.length} step{steps.length === 1 ? '' : 's'} · total{' '}
            <span className="font-mono tabular-nums text-ink-700">
              {formatDuration(totalSeconds)}
            </span>
            <span className="text-ink-400"> (to last finish)</span>
            {sessionActive ? (
              <span className="ml-2 rounded-full bg-olive-500/15 px-2 py-0.5 text-xs font-medium text-olive-600">
                Interactive Mode — editing locked
              </span>
            ) : null}
          </p>
          <InteractiveControls />
        </div>
      </header>

      <section
        className="overflow-hidden rounded-2xl border border-ink-200/80 bg-white/70 shadow-soft backdrop-blur-sm"
        aria-label="Recipe timeline"
      >
        <div className="overflow-x-auto">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <table className="w-full min-w-[56rem] table-fixed border-collapse text-left">
              <colgroup>
                <col className="w-10" />
                <col className="w-[10%]" />
                <col className="w-[12%]" />
                <col className="w-[18%]" />
                <col className="w-[15%]" />
                <col className="w-[22%]" />
                <col className="w-[14%]" />
                <col className="w-12" />
              </colgroup>
              <thead>
                <tr className="border-b border-ink-200 bg-ink-50/90 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500">
                  <th className="px-2 py-3 font-medium" scope="col">
                    <span className="sr-only">Reorder</span>
                  </th>
                  <th className="px-2 py-3 font-medium" scope="col">
                    Step
                  </th>
                  <th className="px-2 py-3 font-medium" scope="col">
                    Flame
                  </th>
                  <th className="px-2 py-3 font-medium" scope="col">
                    Time
                  </th>
                  <th className="px-2 py-3 font-medium" scope="col">
                    Duration
                    {sessionActive ? (
                      <span className="block font-medium normal-case tracking-normal text-ink-400">
                        Left
                      </span>
                    ) : null}
                  </th>
                  <th className="px-2 py-3 font-medium" scope="col">
                    Ingredient &amp; Quantity
                  </th>
                  <th className="px-2 py-3 font-medium" scope="col">
                    Alternatives
                  </th>
                  <th className="px-2 py-3 font-medium" scope="col">
                    <span className="sr-only">Delete</span>
                  </th>
                </tr>
              </thead>
              <SortableContext
                items={steps.map((s) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                {steps.length === 0 ? (
                  <tbody>
                    <tr>
                      <td
                        colSpan={8}
                        className="px-6 py-16 text-center text-sm text-ink-500"
                      >
                        No steps yet. Add the first step to start your timeline.
                      </td>
                    </tr>
                  </tbody>
                ) : (
                  steps.map((step, index) => (
                    <TimelineRow
                      key={step.id}
                      step={step}
                      index={index}
                      previousStartSeconds={
                        index > 0 ? steps[index - 1].startSeconds : undefined
                      }
                      recipeTotalSeconds={Math.max(totalSeconds, 1)}
                      locked={interactiveMode}
                      sessionActive={sessionActive}
                      stepRuntime={stepRuntime[step.id]}
                      onUpdate={(patch) => updateStep(step.id, patch)}
                      onDelete={() => handleDelete(step.id)}
                    />
                  ))
                )}
              </SortableContext>
            </table>
          </DndContext>
        </div>

        <div className="border-t border-ink-100 bg-ink-50/50 px-4 py-3">
          <button
            type="button"
            onClick={addStep}
            disabled={interactiveMode}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
              interactiveMode
                ? 'cursor-not-allowed text-ink-300'
                : 'text-olive-600 hover:bg-olive-500/10 hover:text-olive-500'
            }`}
          >
            <span aria-hidden className="text-base leading-none">
              +
            </span>
            Add Step
          </button>
        </div>
      </section>

      <IngredientsSummary
        ingredientBlocks={steps.map((s) => s.ingredients)}
      />

      <Toaster
        position="bottom-center"
        toastOptions={{
          className: 'font-sans',
        }}
      />
    </div>
  )
}
